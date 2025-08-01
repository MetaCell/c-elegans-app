import SearchIcon from "@mui/icons-material/Search";
import { Box, CircularProgress, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { TreeItem, treeItemClasses } from "@mui/x-tree-view";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGlobalContext } from "../../contexts/GlobalContext";
import { vars } from "../../theme/variables";
import CustomSwitch from "./CustomSwitch";
import PickerWrapper from "./PickerWrapper";
import { type SynapseTreeItem, applyMemorizedStates, filterTreeItems, findTreeItemById, transformSynapsesToTree, recalculateAllParentColors } from "./SynapsesTreeViewHelpers";

const { gray100, gray600 } = vars;

export default function BasicRichTreeView() {
  const { workspaces, currentWorkspaceId } = useGlobalContext();
  const currentWorkspace = workspaces[currentWorkspaceId];
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  const { activeNeurons, activeDatasets, availableNeurons } = currentWorkspace || {};
  const [treeItems, setTreeItems] = useState<SynapseTreeItem[]>([]);
  const [itemVisibilityStates, setItemVisibilityStates] = useState<Record<string, boolean>>({});
  const [itemColorStates, setItemColorStates] = useState<Record<string, string>>({});

  const handleColorClose = useCallback(() => {
    setAnchorEl(null);
    setOpenColorPicker(null);
  }, []);

  const handleColorChange = useCallback((itemId: string, color: any, treeItems: SynapseTreeItem[]) => {
    const item = findTreeItemById(treeItems, itemId);
    
    setItemColorStates((prevStates) => {
      const newStates = { ...prevStates };
      newStates[itemId] = color.hex;

      // Update all children of this group
      const updateChildrenStates = (children: SynapseTreeItem[]) => {
        children.forEach((child) => {
          newStates[child.id] = color.hex;
          if (child.children) { 
            updateChildrenStates(child.children);
          }
        });
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
        parentIds.forEach(parentId => {
          delete newStates[parentId];
        });
      };

      clearParentColors(item, treeItems);

      return newStates;
    });

    // Helper function to recursively find all synapse IDs in the tree
    const getAllSynapseIds = (items: SynapseTreeItem[]): string[] => {
      const synapseIds: string[] = [];
      items.forEach((child) => {
        if (child.type === "synapse") {
          const synapseId = child.id.split("-").slice(-1)[0];
          if (/^\d+$/.test(synapseId)) {
            synapseIds.push(synapseId);
          }
        } else if (child.children) {
          synapseIds.push(...getAllSynapseIds(child.children));
        }
      });
      return synapseIds;
    };

    // Get all synapse IDs from the item and its children
    const synapseIds = item ? getAllSynapseIds([item]) : [];
    
    if (synapseIds.length > 0) {
      currentWorkspace.customUpdate((draft) => {
        synapseIds.forEach((synapseId) => {
          draft.changeSynapseColorForViewers(Number.parseInt(synapseId), color.hex);
        });
      });
    }
  }, [currentWorkspace, treeItems]);

  const synapsesData = currentWorkspace?.getSynapsesData();

  // Function to update tree items
  const updateTreeItems = useCallback(() => {
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
  }, [synapsesData?.synapses, searchTerm, currentWorkspace, availableNeurons, currentWorkspace?.visibilities, itemVisibilityStates, itemColorStates]);

  // Update tree items when dependencies change
  useEffect(() => {
    updateTreeItems();
  }, [updateTreeItems]);

  // Keep tree collapsed by default - no expanded items
  const expandedItems = useMemo(() => {
    const getExpandedIds = (items: SynapseTreeItem[]): string[] => {
      let ids: string[] = [];
      items.forEach((item) => {
        ids.push(item.id);
        if (item.children) {
          ids = ids.concat(getExpandedIds(item.children));
        }
      });
      return ids;
    };
    return getExpandedIds(treeItems);
  }, [treeItems]);

  const handleColorClick = useCallback((event: React.MouseEvent<HTMLElement>, itemId: string) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
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
            children.forEach((child) => {
              newStates[child.id] = checked;
              if (child.children) {
                updateChildrenStates(child.children);
              }
            });
          };

          if (item.children) {
            updateChildrenStates(item.children);
          }

          return newStates;
        });
        if (item?.type === "synapsesGroup") {
          const synapseIds = item.children?.map((child) => child.id.split("-").slice(-1)[0]);

          // Use customUpdate to batch all synapse visibility changes into a single update
          currentWorkspace.customUpdate((draft) => {
            if (checked) {
              synapseIds.forEach((synapseId) => {
                draft._showSynapseInternal(Number.parseInt(synapseId));
              });
            } else {
              synapseIds.forEach((synapseId) => {
                draft._hideSynapseInternal(Number.parseInt(synapseId));
              });
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
        defaultExpandedItems={expandedItems}
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
      {openColorPicker && anchorEl && (
        <PickerWrapper
          open={true}
          anchorEl={anchorEl}
          onClose={handleColorClose}
          onChange={(color) => handleColorChange(openColorPicker, color, treeItems)}
          selectedColor={findTreeItemById(treeItems, openColorPicker)?.color}
        />
      )}
    </Box>
  );
}
