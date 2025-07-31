import { Visibility } from "../../models/models";
import type { TreeViewBaseItem } from "@mui/x-tree-view/models";

// Custom type that extends TreeViewBaseItem to include visibility
export interface SynapseTreeItem extends Omit<TreeViewBaseItem, 'children'> {
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

          // Calculate neuron item visibility based on its children
          neuronItem.isVisible = true;
          
          // Add the neuron item to the appropriate injected group
          injectedGroups.get(injectedNeuronClass)!.children!.push(neuronItem);
        });

        // Add all injected groups to the pre neuron item
        injectedGroups.forEach((injectedGroup) => {
          injectedGroup.children!.sort((a, b) => a.label.localeCompare(b.label));
          // Calculate injected group visibility based on its children
          injectedGroup.isVisible = true;
          preNeuronItem.children!.push(injectedGroup);
        });

        preNeuronItem.children!.sort((a, b) => a.label.localeCompare(b.label));
        // Calculate pre neuron item visibility based on its children
        preNeuronItem.isVisible = true;
        preItem.children!.push(preNeuronItem);
      });

      preItem.children!.sort((a, b) => a.label.localeCompare(b.label));
      // Calculate pre item visibility based on its children
      preItem.isVisible = true;
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

          // Calculate neuron item visibility based on its children
          neuronItem.isVisible = true;
          
          // Add the neuron item to the appropriate injected group
          injectedGroups.get(injectedNeuronClass)!.children!.push(neuronItem);
        });

        // Add all injected groups to the post neuron item
        injectedGroups.forEach((injectedGroup) => {
          injectedGroup.children!.sort((a, b) => a.label.localeCompare(b.label));
          // Calculate injected group visibility based on its children
          injectedGroup.isVisible = true;
          postNeuronItem.children!.push(injectedGroup);
        });

        postNeuronItem.children!.sort((a, b) => a.label.localeCompare(b.label));
        // Calculate post neuron item visibility based on its children
        postNeuronItem.isVisible = true;
        postItem.children!.push(postNeuronItem);
      });

      postItem.children!.sort((a, b) => a.label.localeCompare(b.label));
      // Calculate post item visibility based on its children
      postItem.isVisible = true;
      groupItem.children!.push(postItem);
    }

    groupItem.children!.sort((a, b) => a.label.localeCompare(b.label));
    // Calculate group item visibility based on its children
    groupItem.isVisible = true;
    treeItems.push(groupItem);
  });

  return treeItems;
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

// Function to apply memorized visibility states to tree items
export const applyMemorizedStates = (items: SynapseTreeItem[], itemVisibilityStates: Record<string, boolean>): SynapseTreeItem[] => {
  return items.map(item => {
    const memorizedState = itemVisibilityStates[item.id];
    const updatedItem = {
      ...item,
      isVisible: memorizedState !== undefined ? memorizedState : item.isVisible,
      children: item.children ? applyMemorizedStates(item.children, itemVisibilityStates) : undefined
    };
    return updatedItem;
  });
}; 