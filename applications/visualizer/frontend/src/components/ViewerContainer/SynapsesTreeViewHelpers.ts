import type { TreeViewBaseItem } from "@mui/x-tree-view/models";
import { Visibility } from "../../models/models";

// Custom type that extends TreeViewBaseItem to include visibility
export interface SynapseTreeItem extends Omit<TreeViewBaseItem, "children"> {
  isVisible?: boolean;
  children?: SynapseTreeItem[];
  type?: string;
}

// Function to transform synapses data into tree structure
export const transformSynapsesToTree = (synapses: any, availableNeurons: any, currentWorkspace: any): SynapseTreeItem[] => {
  const treeItems: SynapseTreeItem[] = [];

  // Helper function to get synapse visibility
  const getSynapseVisibility = (synapseId: number): boolean => {
    const synapseVisibility = currentWorkspace.getSynapseVisibility(synapseId);
    return Object.values(synapseVisibility).every((e: any) => e === undefined || e.visibility === Visibility.Visible);
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

  // Calculate parent visibility based on children after building the tree
  const calculateAllParentVisibility = (items: SynapseTreeItem[]): SynapseTreeItem[] => {
    return items.map((item) => {
      const updatedItem = {
        ...item,
        children: item.children ? calculateAllParentVisibility(item.children) : undefined,
      };

      if (updatedItem.children && updatedItem.children.length > 0) {
        updatedItem.isVisible = calculateParentVisibility(updatedItem);
      }

      return updatedItem;
    });
  };

  return calculateAllParentVisibility(treeItems);
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

// Function to apply memorized visibility states to tree items
export const applyMemorizedStates = (items: SynapseTreeItem[], itemVisibilityStates: Record<string, boolean>): SynapseTreeItem[] => {
  return items.map((item) => {
    const memorizedState = itemVisibilityStates[item.id];
    const updatedItem = {
      ...item,
      isVisible: memorizedState !== undefined ? memorizedState : item.isVisible,
      children: item.children ? applyMemorizedStates(item.children, itemVisibilityStates) : undefined,
    };

    // After updating children, recalculate parent visibility based on children
    if (updatedItem.children && updatedItem.children.length > 0) {
      updatedItem.isVisible = calculateParentVisibility(updatedItem);
    }

    return updatedItem;
  });
};
