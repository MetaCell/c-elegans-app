import SearchIcon from "@mui/icons-material/Search";
import { Box, CircularProgress, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { TreeItem, treeItemClasses } from "@mui/x-tree-view";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import type { TreeViewBaseItem } from "@mui/x-tree-view/models";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGlobalContext } from "../../contexts/GlobalContext";
import { Visibility } from "../../models/models";
import { vars } from "../../theme/variables";
import CustomSwitch from "./CustomSwitch";
import PickerWrapper from "./PickerWrapper";

const { gray100, gray600 } = vars;

// Custom type that extends TreeViewBaseItem to include visibility
interface SynapseTreeItem extends Omit<TreeViewBaseItem, 'children'> {
  children?: SynapseTreeItem[];
}

// Function to transform synapses data into tree structure
const transformSynapsesToTree = (synapses: any, availableNeurons: any): SynapseTreeItem[] => {
  const treeItems: SynapseTreeItem[] = [];

  // Iterate through each neuron group (ADA, ADE, etc.)
  Object.entries(synapses).forEach(([neuronGroup, groupData]: [string, any]) => {
    const groupItem: SynapseTreeItem = {
      id: neuronGroup,
      label: neuronGroup,
      children: [],
    };
    // Add pre-synaptic connections
    if (groupData.pre) {
      const preItem: SynapseTreeItem = {
        id: `${neuronGroup}-pre`,
        label: "Pre",
        children: [],
      };

      Object.entries(groupData.pre).forEach(([preNeuron, preData]: [string, any]) => {
        const preNeuronItem: SynapseTreeItem = {
          id: `${neuronGroup}-pre-${preNeuron}`,
          label: preNeuron,
          children: [],
        };

        // Group injected items by their label
        const injectedGroups = new Map<string, SynapseTreeItem>();

        Object.entries(preData).forEach(([neuron, synapses]: [string, any]) => {
          const injectedNeuronClass = availableNeurons[neuron].nclass;

          // Check if we already have an injected group with this label
          if (!injectedGroups.has(injectedNeuronClass)) {
            const injectedNeuronItem: SynapseTreeItem = {
              id: `${neuronGroup}-pre-${preNeuron}-${injectedNeuronClass}`,
              label: injectedNeuronClass,
              children: [],
            };
            injectedGroups.set(injectedNeuronClass, injectedNeuronItem);
          }

          const neuronItem: SynapseTreeItem = {
            id: `${neuronGroup}-pre-${preNeuron}-${injectedNeuronClass}-${neuron}`,
            label: neuron,
            children: synapses.map((synapse: any) => ({
              id: `${neuronGroup}-pre-${preNeuron}-${injectedNeuronClass}-${neuron}-${synapse.id}`,
              label: `${synapse.pre} → ${synapse.posts.join(", ")}`,
            })),
          };

          // Add the neuron item to the appropriate injected group
          injectedGroups.get(injectedNeuronClass)!.children!.push(neuronItem);
        });

        // Add all injected groups to the pre neuron item
        injectedGroups.forEach((injectedGroup) => {
          injectedGroup.children!.sort((a, b) => a.label.localeCompare(b.label));
          preNeuronItem.children!.push(injectedGroup);
        });

        preNeuronItem.children!.sort((a, b) => a.label.localeCompare(b.label));
        preItem.children!.push(preNeuronItem);
      });

      preItem.children!.sort((a, b) => a.label.localeCompare(b.label));
      groupItem.children!.push(preItem);
    }

    // Add post-synaptic connections
    if (groupData.post) {
      const postItem: SynapseTreeItem = {
        id: `${neuronGroup}-post`,
        label: "Post",
        children: [],
      };

      Object.entries(groupData.post).forEach(([postNeuron, postData]: [string, any]) => {
        const postNeuronItem: SynapseTreeItem = {
          id: `${neuronGroup}-post-${postNeuron}`,
          label: postNeuron,
          children: [],
        };

        // Group injected items by their label
        const injectedGroups = new Map<string, SynapseTreeItem>();

        Object.entries(postData).forEach(([neuron, synapses]: [string, any]) => {
          const injectedNeuronClass = availableNeurons[neuron].nclass;

          // Check if we already have an injected group with this label
          if (!injectedGroups.has(injectedNeuronClass)) {
            const injectedNeuronItem: SynapseTreeItem = {
              id: `${neuronGroup}-post-${postNeuron}-${injectedNeuronClass}`,
              label: injectedNeuronClass,
              children: [],
            };
            injectedGroups.set(injectedNeuronClass, injectedNeuronItem);
          }

          const neuronItem: SynapseTreeItem = {
            id: `${neuronGroup}-post-${postNeuron}-${injectedNeuronClass}-${neuron}`,
            label: neuron,
            children: synapses.map((synapse: any) => ({
              id: `${neuronGroup}-post-${postNeuron}-${injectedNeuronClass}-${neuron}-${synapse.id}`,
              label: `${synapse.pre} → ${synapse.posts.join(", ")}`,
            })),
          };

          // Add the neuron item to the appropriate injected group
          injectedGroups.get(injectedNeuronClass)!.children!.push(neuronItem);
        });

        // Add all injected groups to the post neuron item
        injectedGroups.forEach((injectedGroup) => {
          injectedGroup.children!.sort((a, b) => a.label.localeCompare(b.label));
          postNeuronItem.children!.push(injectedGroup);
        });

        postNeuronItem.children!.sort((a, b) => a.label.localeCompare(b.label));
        postItem.children!.push(postNeuronItem);
      });

      postItem.children!.sort((a, b) => a.label.localeCompare(b.label));
      groupItem.children!.push(postItem);
    }

    treeItems.push(groupItem);
  });

  // Sort groups alphabetically
  treeItems.sort((a, b) => a.label.localeCompare(b.label));

  return treeItems;
};

// Function to filter tree items based on search term
const filterTreeItems = (items: SynapseTreeItem[], searchTerm: string): SynapseTreeItem[] => {
  if (!searchTerm.trim()) {
    return items;
  }

  const filteredItems: SynapseTreeItem[] = [];

  items.forEach((item) => {
    const filteredChildren: SynapseTreeItem[] = [];

    if (item.children) {
      item.children.forEach((child) => {
        const filteredGrandChildren: SynapseTreeItem[] = [];

        if (child.children) {
          child.children.forEach((grandChild) => {
            const filteredGreatGrandChildren: SynapseTreeItem[] = [];

            if (grandChild.children) {
              grandChild.children.forEach((greatGrandChild) => {
                const filteredSynapses: SynapseTreeItem[] = [];

                if (greatGrandChild.children) {
                  greatGrandChild.children.forEach((synapse) => {
                    // Check if synapse name matches search term
                    if (synapse.label.toLowerCase().includes(searchTerm.toLowerCase())) {
                      filteredSynapses.push(synapse);
                    }
                  });
                }

                // If we have matching synapses, include the entire path
                if (filteredSynapses.length > 0) {
                  filteredGreatGrandChildren.push({
                    ...greatGrandChild,
                    children: filteredSynapses,
                  });
                }
              });
            }

            // If we have matching great-grandchildren, include the path
            if (filteredGreatGrandChildren.length > 0) {
              filteredGrandChildren.push({
                ...grandChild,
                children: filteredGreatGrandChildren,
              });
            }
          });
        }

        // If we have matching grandchildren, include the path
        if (filteredGrandChildren.length > 0) {
          filteredChildren.push({
            ...child,
            children: filteredGrandChildren,
          });
        }
      });
    }

    // If we have matching children, include the group
    if (filteredChildren.length > 0) {
      filteredItems.push({
        ...item,
        children: filteredChildren,
      });
    }
  });

  return filteredItems;
};

export default function BasicRichTreeView() {
  const { getCurrentWorkspace } = useGlobalContext();
  const currentWorkspace = getCurrentWorkspace();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);
  const { activeNeurons, activeDatasets, availableNeurons } = currentWorkspace;


  const handleColorClose = useCallback(() => {
    setAnchorEl(null);
    setOpenColorPicker(null);
  }, []);

  const handleColorChange = useCallback((itemId: string, color: any) => {
    console.log(itemId, color);
  }, []);

  const synapsesData = currentWorkspace?.getSynapsesData();

  const treeItems = useMemo(() => {
    if (!synapsesData?.synapses) return [];
    const fullTree = transformSynapsesToTree(synapsesData.synapses, availableNeurons);
    return filterTreeItems(fullTree, searchTerm);
  }, [synapsesData?.synapses, searchTerm, currentWorkspace]);

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
      const lastPart = itemId.split("-").slice(-1)[0];
      const isOnlyNumbers = /^\d+$/.test(lastPart);

      if (isOnlyNumbers) {
        if (checked) {
          currentWorkspace.showSynapse(Number.parseInt(lastPart));
        } else {
          currentWorkspace.hideSynapse(Number.parseInt(lastPart));
        }
      } else {
        console.log(`No synapse IDs found for item: ${itemId}`);
      }
    },
    [currentWorkspace],
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

        const getSynapseVisibility = (synapseId: number) => {
          const synapseVisibility = currentWorkspace.getSynapseVisibility(synapseId);
          const checked = Object.values(synapseVisibility).every((e) => e === undefined || e.visibility === Visibility.Visible);
          return checked;
        };

        // Check if this is a neuron item (contains neuron name in the path)
        const lastPart = itemId.split("-").slice(-1)[0];
        const isOnlyNumbers = /^\d+$/.test(lastPart);
        const isVisible = isOnlyNumbers ? getSynapseVisibility(Number.parseInt(lastPart)) : true;
      
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
                  backgroundColor: "#cccccc",
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
              // "& .MuiTreeItem-iconContainer": {
              //   display: "none",
              // },
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
          onChange={(color) => handleColorChange(openColorPicker, color)}
          selectedColor={"#cccccc"}
        />
      )}
    </Box>
  );
}
