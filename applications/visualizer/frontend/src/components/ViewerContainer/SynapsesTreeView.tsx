import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import type { TreeViewBaseItem } from "@mui/x-tree-view/models";
import { useState, useMemo, useEffect, useCallback } from "react";
import { TextField, Box, InputAdornment, CircularProgress, Stack, Typography } from "@mui/material";
import { vars } from "../../theme/variables";
import SearchIcon from "@mui/icons-material/Search";
import { useGlobalContext } from "../../contexts/GlobalContext";
import { TreeItem, treeItemClasses } from "@mui/x-tree-view";
import ColorPicker from "./ColorPicker";
import PickerWrapper from "./PickerWrapper";
import CustomSwitch from "./CustomSwitch";

const { gray100, gray600 } = vars;

// Function to transform synapses data into tree structure
const transformSynapsesToTree = (synapses: any): TreeViewBaseItem[] => {
  const treeItems: TreeViewBaseItem[] = [];

  // Iterate through each neuron group (ADA, ADE, etc.)
  Object.entries(synapses).forEach(([neuronGroup, groupData]: [string, any]) => {
    const groupItem: TreeViewBaseItem = {
      id: neuronGroup,
      label: neuronGroup,
      children: [],
    };

    // Add pre-synaptic connections
    if (groupData.pre) {
      const preItem: TreeViewBaseItem = {
        id: `${neuronGroup}-pre`,
        label: "Pre",
        children: [],
      };

      Object.entries(groupData.pre).forEach(([preNeuron, preData]: [string, any]) => {
        const preNeuronItem: TreeViewBaseItem = {
          id: `${neuronGroup}-pre-${preNeuron}`,
          label: preNeuron,
          children: [],
        };

        Object.entries(preData).forEach(([postNeuron, synapses]: [string, any]) => {
          const postNeuronItem: TreeViewBaseItem = {
            id: `${neuronGroup}-pre-${preNeuron}-${postNeuron}`,
            label: postNeuron,
            children: synapses.map((synapse: any) => ({
              id: `${neuronGroup}-pre-${preNeuron}-${postNeuron}-${synapse.id}`,
              label: `${synapse.pre} → ${synapse.posts.join(", ")}`,
            })),
          };
          preNeuronItem.children!.push(postNeuronItem);
        });

        preNeuronItem.children!.sort((a, b) => a.label.localeCompare(b.label));
        preItem.children!.push(preNeuronItem);
      });

      preItem.children!.sort((a, b) => a.label.localeCompare(b.label));
      groupItem.children!.push(preItem);
    }

    // Add post-synaptic connections
    if (groupData.post) {
      const postItem: TreeViewBaseItem = {
        id: `${neuronGroup}-post`,
        label: "Post",
        children: [],
      };

      Object.entries(groupData.post).forEach(([postNeuron, postData]: [string, any]) => {
        const postNeuronItem: TreeViewBaseItem = {
          id: `${neuronGroup}-post-${postNeuron}`,
          label: postNeuron,
          children: [],
        };

        Object.entries(postData).forEach(([preNeuron, synapses]: [string, any]) => {
          const preNeuronItem: TreeViewBaseItem = {
            id: `${neuronGroup}-post-${postNeuron}-${preNeuron}`,
            label: preNeuron,
            children: synapses.map((synapse: any) => ({
              id: `${neuronGroup}-post-${postNeuron}-${preNeuron}-${synapse.id}`,
              label: `${synapse.pre} → ${synapse.posts.join(", ")}`,
            })),
          };
          postNeuronItem.children!.push(preNeuronItem);
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
const filterTreeItems = (items: TreeViewBaseItem[], searchTerm: string): TreeViewBaseItem[] => {
  if (!searchTerm.trim()) {
    return items;
  }

  const filteredItems: TreeViewBaseItem[] = [];

  items.forEach((item) => {
    const filteredChildren: TreeViewBaseItem[] = [];

    if (item.children) {
      item.children.forEach((child) => {
        const filteredGrandChildren: TreeViewBaseItem[] = [];

        if (child.children) {
          child.children.forEach((grandChild) => {
            const filteredGreatGrandChildren: TreeViewBaseItem[] = [];

            if (grandChild.children) {
              grandChild.children.forEach((greatGrandChild) => {
                const filteredSynapses: TreeViewBaseItem[] = [];

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

  useEffect(() => {
    if (!currentWorkspace) return;

    const { activeNeurons, activeDatasets } = currentWorkspace;
    
    if (activeNeurons?.size > 0 && Object.keys(activeDatasets || {}).length > 0) {
      setIsLoading(true);
      currentWorkspace.fetchSynapses().catch((error) => {
        console.error("Failed to fetch synapses:", error);
      });
      setIsLoading(false);
    }
  }, [
    currentWorkspace?.id,
    currentWorkspace?.activeNeurons,
    currentWorkspace?.activeDatasets,
    currentWorkspace?.visibilities?.neurons,
  ]);

  const handleColorClick = useCallback((event: React.MouseEvent<HTMLElement>, itemId: string) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
    setOpenColorPicker(itemId);
  }, []);

  const handleColorClose = useCallback(() => {
    setAnchorEl(null);
    setOpenColorPicker(null);
  }, []);

  const handleColorChange = useCallback((itemId: string, color: any) => {
    console.log(itemId, color);
  }, []);

  const handleSwitchChange = useCallback((itemId: string, checked: boolean) => {
    console.log(itemId, checked);
  }, []);

  const synapsesData = currentWorkspace?.getSynapsesData();

  const treeItems = useMemo(() => {
    if (!synapsesData?.synapses) return [];
    const fullTree = transformSynapsesToTree(synapsesData.synapses);
    return filterTreeItems(fullTree, searchTerm);
  }, [synapsesData?.synapses, searchTerm]);

  // Keep tree collapsed by default - no expanded items
  const expandedItems = useMemo(() => {
    const getExpandedIds = (items: TreeViewBaseItem[]): string[] => {
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

  if (isLoading) return <Box><CircularProgress /></Box>;
  
  const treeSlots = useMemo(() => ({
    item: (props: any) => {            
      const itemId = props.itemId;
      const hasChildren = props.children && props.children.length > 0;
      
      const CustomLabel = () => (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "100%" }}>
          <CustomSwitch
            onChange={(_, checked) => handleSwitchChange(itemId, checked)}
            width={20}
            height={12}
            thumbDimension={8}
          />
          {hasChildren && (
            <Box
              sx={{
                width: "16px",
                height: "16px",
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
            <Typography variant="h6" fontWeight={500} fontSize={14}>{props.label}</Typography>
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
            },
            [`& .${treeItemClasses.groupTransition}`]: {
              marginLeft: "15px",
              paddingLeft: "10px",
              borderLeft: `1px solid #ECECE9`,
            },
            "& .MuiTreeItem-iconContainer": {
              display: "none",
            },
          }}
        />
      );
    },
  }), [handleSwitchChange, handleColorClick]);

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
