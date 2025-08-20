import SearchIcon from "@mui/icons-material/Search";
import { Box, CircularProgress, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { TreeItem, treeItemClasses } from "@mui/x-tree-view";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGlobalContext } from "../../contexts/GlobalContext";
import { vars } from "../../theme/variables";
import CustomSwitch from "./CustomSwitch";
import PickerWrapper from "./PickerWrapper";
import {
  type SynapseTreeItem,
  applyMemorizedStates,
  filterTreeItems,
  findTreeItemById,
  getAllSynapseIds,
  recalculateAllParentColors,
  transformSynapsesToTree,
} from "./SynapsesTreeViewHelpers";

const { gray100, gray600 } = vars;

export default function BasicRichTreeView() {
  const { workspaces, currentWorkspaceId } = useGlobalContext();
  const currentWorkspace = workspaces[currentWorkspaceId];
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const anchorElRef = useRef<HTMLElement | null>(null);
  const virtualAnchorRef = useRef<HTMLDivElement | null>(null);
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  const [pendingColorChange, setPendingColorChange] = useState<{ itemId: string; color: string } | null>(null);
  const { activeNeurons, activeDatasets, availableNeurons } = currentWorkspace || {};
  const [treeItems, setTreeItems] = useState<SynapseTreeItem[]>([]);
  const [itemVisibilityStates, setItemVisibilityStates] = useState<Record<string, boolean>>({});
  const [itemColorStates, setItemColorStates] = useState<Record<string, string>>({});
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const handleColorClose = useCallback(() => {
    // Apply pending color change to tree state
    if (pendingColorChange) {
      const { itemId, color } = pendingColorChange;
      const item = findTreeItemById(treeItems, itemId);

      setItemColorStates((prevStates) => {
        const newStates = { ...prevStates };
        newStates[itemId] = color;

        // Update all children of this group
        const updateChildrenStates = (children: SynapseTreeItem[]) => {
          for (const child of children) {
            newStates[child.id] = color;
            if (child.children) {
              updateChildrenStates(child.children);
            }
          }
        };

        if (item?.children) {
          updateChildrenStates(item.children);
        }

        // Clear memorized colors for all parents of this item to force recalculation
        const clearParentColors = (targetItem: SynapseTreeItem | undefined, allItems: SynapseTreeItem[]) => {
          if (!targetItem) return;

          const findParents = (items: SynapseTreeItem[], targetId: string, parents: string[] = []): string[] => {
            for (const item of items) {
              if (item.children) {
                for (const child of item.children) {
                  if (child.id === targetId) {
                    return [...parents, item.id];
                  }
                  const childParents = findParents([child], targetId, [...parents, item.id]);
                  if (childParents.length > 0) {
                    return childParents;
                  }
                }
              }
            }
            return [];
          };

          const parentIds = findParents(allItems, targetItem.id);
          for (const parentId of parentIds) {
            delete newStates[parentId];
          }
        };

        clearParentColors(item, treeItems);

        return newStates;
      });

      setPendingColorChange(null);
    }

    // Clean up virtual anchor
    if (virtualAnchorRef.current && document.body.contains(virtualAnchorRef.current)) {
      document.body.removeChild(virtualAnchorRef.current);
    }
    virtualAnchorRef.current = null;
    anchorElRef.current = null;
    setOpenColorPicker(null);
  }, [pendingColorChange, treeItems]);

  const handleColorChange = useCallback(
    (itemId: string, color: any, treeItems: SynapseTreeItem[]) => {
      // Only update the 3D visualization immediately, defer tree state updates
      const item = findTreeItemById(treeItems, itemId);
      const synapseIds = item ? getAllSynapseIds([item]) : [];

      if (synapseIds.length > 0) {
        currentWorkspace.changeSynapsesColorForViewers(
          synapseIds.map((s) => Number.parseInt(s)),
          color.hex,
        );
      }

      // Store the color change to apply when picker closes
      setPendingColorChange({ itemId, color: color.hex });
    },
    [currentWorkspace, treeItems],
  );

  const synapsesData = currentWorkspace?.getSynapsesData();

  // Function to update tree items
  const updateTreeItems = useCallback(() => {
    // Skip tree updates while color picker is open to prevent anchor invalidation
    if (openColorPicker) {
      return;
    }

    if (!synapsesData?.synapses) {
      setTreeItems([]);
      return;
    }
    const fullTree = transformSynapsesToTree(synapsesData.synapses, availableNeurons, currentWorkspace);

    // Apply memorized visibility states to the tree
    const treeWithMemorizedStates = applyMemorizedStates(fullTree, itemVisibilityStates, itemColorStates);

    // Recalculate all parent colors based on children
    const treeWithRecalculatedColors = recalculateAllParentColors(treeWithMemorizedStates, itemColorStates);

    const filteredTree = filterTreeItems(treeWithRecalculatedColors, searchTerm);
    setTreeItems(filteredTree);
  }, [
    synapsesData?.synapses,
    searchTerm,
    currentWorkspace,
    availableNeurons,
    currentWorkspace?.visibilities,
    itemVisibilityStates,
    itemColorStates,
    openColorPicker,
  ]);

  // Update tree items when dependencies change
  useEffect(() => {
    updateTreeItems();
  }, [updateTreeItems]);

  const handleColorClick = useCallback((event: React.MouseEvent<HTMLElement>, itemId: string) => {
    event.stopPropagation();
    event.preventDefault();

    // Create a virtual anchor element that won't be affected by DOM changes
    const rect = event.currentTarget.getBoundingClientRect();
    if (!virtualAnchorRef.current) {
      virtualAnchorRef.current = document.createElement("div");
      virtualAnchorRef.current.style.position = "fixed";
      virtualAnchorRef.current.style.pointerEvents = "none";
      virtualAnchorRef.current.style.zIndex = "-1";
      document.body.appendChild(virtualAnchorRef.current);
    }

    virtualAnchorRef.current.style.left = `${rect.left}px`;
    virtualAnchorRef.current.style.top = `${rect.top}px`;
    virtualAnchorRef.current.style.width = `${rect.width}px`;
    virtualAnchorRef.current.style.height = `${rect.height}px`;

    anchorElRef.current = virtualAnchorRef.current;
    setOpenColorPicker(itemId);
  }, []);

  const handleSynapseVisibilityToggle = useCallback(
    (itemId: string, checked: boolean) => {
      if (!currentWorkspace) return;
      const lastPart = itemId.split("-").slice(-1)[0];
      const isSynapseId = /^\d+$/.test(lastPart);

      if (isSynapseId) {
        // Handle individual synapse visibility
        if (checked) {
          currentWorkspace.showSynapse(Number.parseInt(lastPart));
        } else {
          currentWorkspace.hideSynapse(Number.parseInt(lastPart));
        }

        // Update the memorized visibility state
        setItemVisibilityStates((prevStates) => ({
          ...prevStates,
          [itemId]: checked,
        }));
      } else {
        const item = findTreeItemById(treeItems, itemId);
        // Update the memorized visibility states for the group and all its children
        setItemVisibilityStates((prevStates) => {
          const newStates = { ...prevStates };
          newStates[itemId] = checked;

          // Update all children of this group
          const updateChildrenStates = (children: SynapseTreeItem[]) => {
            for (const child of children) {
              newStates[child.id] = checked;
              if (child.children) {
                updateChildrenStates(child.children);
              }
            }
          };

          if (item.children) {
            updateChildrenStates(item.children);
          }

          return newStates;
        });
        if (item?.type === "synapsesGroup") {
          const synapseIds = item.children ? getAllSynapseIds(item.children) : [];

          // Use customUpdate to batch all synapse visibility changes into a single update
          currentWorkspace.customUpdate((draft) => {
            const updateMethod = checked ? draft._showSynapseInternal : draft._hideSynapseInternal;
            for (const synapseId of synapseIds) {
              updateMethod(Number.parseInt(synapseId));
            }
          });
        }
      }
    },
    [currentWorkspace, treeItems],
  );

  useEffect(() => {
    if (!currentWorkspace) return;
    if (activeNeurons?.size > 0 && Object.keys(activeDatasets || {}).length > 0) {
      setIsLoading(true);
      currentWorkspace.fetchSynapses().catch((error) => {
        console.error("Failed to fetch synapses:", error);
      });
      setIsLoading(false);
    }
  }, [currentWorkspace?.id, currentWorkspace?.activeNeurons, currentWorkspace?.activeDatasets, currentWorkspace?.visibilities?.neurons]);

  if (isLoading)
    return (
      <Box>
        <CircularProgress />
      </Box>
    );

  const treeSlots = useMemo(
    () => ({
      item: (props: any) => {
        const itemId = props.itemId;
        const hasChildren = props.children && props.children.length > 0;

        // Get visibility directly from treeItems state
        const treeItem = findTreeItemById(treeItems, itemId);
        const isVisible = treeItem?.isVisible;
        const color = treeItem?.color;
        const CustomLabel = () => (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "100%" }}>
            <CustomSwitch
              checked={isVisible}
              onChange={(e, checked) => {
                e.stopPropagation();
                e.preventDefault();
                handleSynapseVisibilityToggle(itemId, checked);
              }}
              width={20}
              height={12}
              thumbDimension={8}
            />
            {hasChildren && (
              <Box
                sx={{
                  width: "0.875rem",
                  height: "0.875rem",
                  backgroundColor: color,
                  border: "1px solid #999",
                  borderRadius: "2px",
                  cursor: "pointer",
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
                onClick={(e) => handleColorClick(e, itemId)}
              />
            )}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight={500} fontSize={14}>
                {props.label}
              </Typography>
            </Box>
          </Stack>
        );

        return (
          <TreeItem
            {...props}
            id={itemId}
            label={<CustomLabel />}
            sx={{
              [`& .${treeItemClasses.content}`]: {
                padding: "8px",
                "&.Mui-selected": {
                  backgroundColor: "transparent",
                },
              },
              [`& .${treeItemClasses.groupTransition}`]: {
                marginLeft: "15px",
                paddingLeft: "10px",
                borderLeft: `1px solid #ECECE9`,
              },
            }}
          />
        );
      },
    }),
    [handleColorClick, currentWorkspace, handleSynapseVisibilityToggle, treeItems],
  );

  return (
    <Box sx={{ width: "100%" }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search synapses..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: "1.25rem", margin: "0 !important" }} />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: "1rem",
          "& .MuiOutlinedInput-root": {
            padding: "1rem 2rem 1rem 0.75rem",
            borderRadius: 0,
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: gray100,
              boxShadow: "none",
            },
            "& .MuiInputBase-input": {
              color: gray600,
              fontWeight: 500,
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderLeft: "none",
              borderRight: "none",
            },
          },
        }}
      />
      <RichTreeView
        items={treeItems}
        expandedItems={expandedItems}
        onExpandedItemsChange={(_event, newExpandedItems) => setExpandedItems(newExpandedItems)}
        sx={{
          "& .MuiTreeItem-root": {
            position: "relative",
            "&:before": {
              position: "absolute",
              left: "-10px",
              top: "0px",
              borderLeft: `1px solid ${gray100}`,
              borderBottom: `1px solid ${gray100}`,
              content: '""',
              width: ".5rem",
              height: "1em",
              borderBottomLeftRadius: "50%",
            },
            "&:after": {
              position: "absolute",
              left: "-10px",
              bottom: "0px",
              content: '""',
              width: ".5rem",
              height: "100%",
            },
            "&:last-child": {
              "&:after": {
                display: "none",
              },
            },
          },
        }}
        slots={treeSlots}
      />
      {openColorPicker && anchorElRef.current && (
        <PickerWrapper
          open={true}
          anchorEl={anchorElRef.current}
          onClose={handleColorClose}
          onChange={(color) => handleColorChange(openColorPicker, color, treeItems)}
          selectedColor={pendingColorChange?.color || findTreeItemById(treeItems, openColorPicker)?.color}
        />
      )}
    </Box>
  );
}
