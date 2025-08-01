import type { TreeViewBaseItem } from "@mui/x-tree-view/models";
import { Visibility } from "../../models/models";

// Custom type that extends TreeViewBaseItem to include visibility
export interface SynapseTreeItem extends Omit<TreeViewBaseItem, "children"> {
  isVisible?: boolean;
  children?: SynapseTreeItem[];
  type?: string;
  color?: string;
}

// Function to transform synapses data into tree structure
export const transformSynapsesToTree = (synapses: any, availableNeurons: any, currentWorkspace: any): SynapseTreeItem[] => {
  const treeItems: SynapseTreeItem[] = [];

  // Helper function to get synapse visibility
  const getSynapseVisibility = (synapseId: number): boolean => {
    const synapseVisibility = currentWorkspace.getSynapseVisibility(synapseId);
    return Object.values(synapseVisibility).every((e: any) => e === undefined || e.visibility === Visibility.Visible);
  };

  const getSynapseColor = (synapseId: number): string => {
    const synapseColor = currentWorkspace.getSynapseColor(synapseId);
    return synapseColor;
  };

  // Helper function to calculate parent visibility based on children
  const calculateParentVisibility = (item: SynapseTreeItem): boolean => {
    if (!item.children || item.children.length === 0) {
      return item.isVisible ?? true;
    }

    // Get all children's visibility states
    const childrenVisibility = item.children.map((child) => calculateParentVisibility(child));

    // If all children have the same visibility state, parent should match that state
    // If children have mixed states, parent should be visible (true)
    const allSameState = childrenVisibility.every((state) => state === childrenVisibility[0]);

    if (allSameState) {
      return childrenVisibility[0];
    } else {
      // Mixed states - parent should be visible (true)
      return true;
    }
  };

  // Iterate through each neuron group (ADA, ADE, etc.)
  Object.entries(synapses).forEach(([neuronGroup, groupData]: [string, any]) => {
    const groupItem: SynapseTreeItem = {
      id: neuronGroup,
      label: neuronGroup,
      children: [],
      type: "group",
    };
    // Add pre-synaptic connections
    if (groupData.pre) {
      const preItem: SynapseTreeItem = {
        id: `${neuronGroup}-pre`,
        label: "Pre",
        children: [],
        type: "group",
      };

      Object.entries(groupData.pre).forEach(([preNeuron, preData]: [string, any]) => {
        const preNeuronItem: SynapseTreeItem = {
          id: `${neuronGroup}-pre-${preNeuron}`,
          label: preNeuron,
          children: [],
          type: "group",
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
              type: "group",
            };
            injectedGroups.set(injectedNeuronClass, injectedNeuronItem);
          }

          const neuronItem: SynapseTreeItem = {
            id: `${neuronGroup}-pre-${preNeuron}-${injectedNeuronClass}-${neuron}`,
            label: neuron,
            children: synapses.map((synapse: any) => ({
              id: `${neuronGroup}-pre-${preNeuron}-${injectedNeuronClass}-${neuron}-${synapse.id}`,
              label: `${synapse.pre} → ${synapse.posts.join(", ")}`,
              // Leaf nodes (synapses) get their actual visibility state
              isVisible: getSynapseVisibility(synapse.id),
              type: "synapse",
              color: getSynapseColor(synapse.id),
            })),
            type: "synapsesGroup",
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
        type: "group",
      };

      Object.entries(groupData.post).forEach(([postNeuron, postData]: [string, any]) => {
        const postNeuronItem: SynapseTreeItem = {
          id: `${neuronGroup}-post-${postNeuron}`,
          label: postNeuron,
          children: [],
          type: "group",
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
              type: "group",
            };
            injectedGroups.set(injectedNeuronClass, injectedNeuronItem);
          }

          const neuronItem: SynapseTreeItem = {
            id: `${neuronGroup}-post-${postNeuron}-${injectedNeuronClass}-${neuron}`,
            label: neuron,
            children: synapses.map((synapse: any) => ({
              id: `${neuronGroup}-post-${postNeuron}-${injectedNeuronClass}-${neuron}-${synapse.id}`,
              label: `${synapse.pre} → ${synapse.posts.join(", ")}`,
              // Leaf nodes (synapses) get their actual visibility state
              isVisible: getSynapseVisibility(synapse.id),
              type: "synapse",
              color: getSynapseColor(synapse.id),
            })),
            type: "synapsesGroup",
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

    groupItem.children!.sort((a, b) => a.label.localeCompare(b.label));
    treeItems.push(groupItem);
  });

  // Calculate parent visibility and color based on children after building the tree
  const calculateAllParentStates = (items: SynapseTreeItem[]): SynapseTreeItem[] => {
    return items.map((item) => {
      const updatedItem = {
        ...item,
        children: item.children ? calculateAllParentStates(item.children) : undefined,
      };

      if (updatedItem.children && updatedItem.children.length > 0) {
        updatedItem.isVisible = calculateParentVisibility(updatedItem);
        updatedItem.color = calculateParentColor(updatedItem);
      }

      return updatedItem;
    });
  };

  return calculateAllParentStates(treeItems);
};

// Function to filter tree items based on search term
export const filterTreeItems = (items: SynapseTreeItem[], searchTerm: string): SynapseTreeItem[] => {
  if (!searchTerm) return items;

  const filterRecursive = (items: SynapseTreeItem[]): SynapseTreeItem[] => {
    return items
      .map((item) => {
        const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase());
        const children = item.children ? filterRecursive(item.children) : undefined;
        const hasMatchingChildren = children && children.length > 0;

        if (matchesSearch || hasMatchingChildren) {
          return {
            ...item,
            children,
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  };

  return filterRecursive(items);
};

// Function to find a tree item by ID
export const findTreeItemById = (items: SynapseTreeItem[], id: string): SynapseTreeItem | undefined => {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    if (item.children) {
      const result = findTreeItemById(item.children, id);
      if (result) return result;
    }
  }
  return undefined;
};

// Function to calculate parent visibility based on children
const calculateParentVisibility = (item: SynapseTreeItem): boolean => {
  if (!item.children || item.children.length === 0) {
    return item.isVisible ?? true;
  }

  // Get all children's visibility states
  const childrenVisibility = item.children.map((child) => calculateParentVisibility(child));

  // If all children have the same visibility state, parent should match that state
  // If children have mixed states, parent should be visible (true)
  const allSameState = childrenVisibility.every((state) => state === childrenVisibility[0]);

  if (allSameState) {
    return childrenVisibility[0];
  } else {
    // Mixed states - parent should be visible (true)
    return true;
  }
};

// Function to calculate parent color based on children
export const calculateParentColor = (item: SynapseTreeItem): string | undefined => {
  if (!item.children || item.children.length === 0) {
    return item.color; // Base case: leaf node or no children, return its own color
  }

  const childrenColors = item.children.map((child) => calculateParentColor(child)); // Get all children's effective colors, including undefined

  // Filter out undefined colors to check for sameness among defined colors
  const definedChildrenColors = childrenColors.filter(Boolean);

  // Case 1: All children (or their descendants) have no specific color (all undefined)
  if (definedChildrenColors.length === 0) {
    return undefined; // If all children are undefined, parent should be undefined
  }

  // Case 2: All defined children have the same color
  if (definedChildrenColors.every((color) => color === definedChildrenColors[0])) {
    // Check if there are any undefined children. If so, it's a mixed state.
    if (childrenColors.some((color) => color === undefined)) {
      return undefined; // Mixed defined and undefined children, so parent is undefined
    }
    return definedChildrenColors[0]; // All children have the same defined color
  } else {
    // Case 3: Children have mixed defined colors
    return undefined;
  }
};

// Function to recalculate all parent colors based on children
export const recalculateAllParentColors = (items: SynapseTreeItem[], itemColorStates: Record<string, string>): SynapseTreeItem[] => {
  return items.map((item) => {
    const memorizedColor = itemColorStates[item.id];
    const updatedItem = {
      ...item,
      children: item.children ? recalculateAllParentColors(item.children, itemColorStates) : undefined,
    };

    // After updating children, recalculate parent color based on children
    if (updatedItem.children && updatedItem.children.length > 0) {
      // Only recalculate if this item doesn't have a memorized color
      if (memorizedColor === undefined) {
        updatedItem.color = calculateParentColor(updatedItem);
      } else {
        updatedItem.color = memorizedColor;
      }
    } else {
      // For leaf nodes, use memorized color if available, otherwise keep original color
      updatedItem.color = memorizedColor !== undefined ? memorizedColor : item.color;
    }

    return updatedItem;
  });
};

// Function to apply memorized visibility states to tree items
export const applyMemorizedStates = (
  items: SynapseTreeItem[],
  itemVisibilityStates: Record<string, boolean>,
  itemColorStates: Record<string, string>,
): SynapseTreeItem[] => {
  return items.map((item) => {
    const memorizedState = itemVisibilityStates[item.id];
    const memorizedColor = itemColorStates[item.id];
    const updatedItem = {
      ...item,
      isVisible: memorizedState !== undefined ? memorizedState : item.isVisible,
      children: item.children ? applyMemorizedStates(item.children, itemVisibilityStates, itemColorStates) : undefined,
      color: memorizedColor !== undefined ? memorizedColor : item.color,
    };

    // After updating children, recalculate parent visibility and color based on children
    if (updatedItem.children && updatedItem.children.length > 0) {
      updatedItem.isVisible = calculateParentVisibility(updatedItem);

      // For color inheritance:
      // 1. If this item has a memorized color, use it (preserve user choice)
      // 2. If not, calculate from children (which may have memorized colors)
      if (memorizedColor === undefined) {
        updatedItem.color = calculateParentColor(updatedItem);
      }
      // If memorizedColor is defined, keep it (don't recalculate)
    }

    return updatedItem;
  });
};

// Function to recursively find all synapse IDs in the tree
export const getAllSynapseIds = (items: SynapseTreeItem[]): string[] => {
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
