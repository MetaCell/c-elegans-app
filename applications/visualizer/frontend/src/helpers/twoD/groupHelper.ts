import type { NeuronGroup, Workspace } from "../../models";
import type { Core } from "cytoscape";
import { SELECTED_CLASS } from "../../settings/twoDSettings.tsx";

export const groupNeurons = (selectedNeurons: Set<string>, workspace: Workspace) => {
  const newGroupId = `group_${Date.now()}`;
  const newGroupNeurons = new Set<string>();
  const groupsToDelete = new Set<string>();
  let originalGroupName = "";
  let originalGroupColor = "#9FEE9A"; // Default color if no group to delete

  // Gather all neurons that should be part of the new group
  for (const neuronId of selectedNeurons) {
    let isPartOfAnotherGroup = false;
    const group = workspace.neuronGroups[neuronId];

    // Check if the neuronId is a group itself or part of another group
    if (group) {
      group.neurons.forEach((groupedNeuronId) => {
        newGroupNeurons.add(groupedNeuronId);
      });
      groupsToDelete.add(neuronId);
      originalGroupName = group.name;
      originalGroupColor = group.color;
    } else {
      Object.entries(workspace.neuronGroups).forEach(([groupId, existingGroup]) => {
        if (existingGroup.neurons.has(neuronId)) {
          existingGroup.neurons.forEach((groupedNeuronId) => {
            newGroupNeurons.add(groupedNeuronId);
          });
          groupsToDelete.add(groupId);
          originalGroupName = existingGroup.name;
          originalGroupColor = existingGroup.color;
          isPartOfAnotherGroup = true;
        }
      });

      // If neuronId is not part of any group, add it directly
      if (!isPartOfAnotherGroup) {
        newGroupNeurons.add(neuronId);
      }
    }
  }

  // Create the new group with the gathered neurons
  const newGroup: NeuronGroup = {
    id: newGroupId,
    name: originalGroupName || newGroupId,
    color: originalGroupColor,
    neurons: newGroupNeurons,
  };

  return { newGroupId, newGroup, groupsToDelete };
};

export function removeNodeFromGroup(cy: Core, nodeId: string, setSelected: boolean) {
  const cyNode = cy.getElementById(nodeId);
  if (cyNode && cyNode.isNode()) {
    cyNode.move({ parent: null });
    if (setSelected) {
      cyNode.addClass(SELECTED_CLASS);
    }
  }
}
