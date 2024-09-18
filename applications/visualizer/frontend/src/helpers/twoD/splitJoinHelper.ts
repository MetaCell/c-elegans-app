import { ViewerType, type Workspace } from "../../models";
import { getDefaultViewerData, type GraphViewerData, Visibility } from "../../models/models.ts";
import { calculateMeanPosition, calculateSplitPositions, isNeuronCell, isNeuronClass } from "./twoDHelpers.ts";

interface SplitJoinState {
  split: Set<string>;
  join: Set<string>;
}

export const processNeuronSplit = (workspace: Workspace, splitJoinState: SplitJoinState): SplitJoinState => {
  const newSplit = new Set(splitJoinState.split);
  const newJoin = new Set(splitJoinState.join);

  const newSelectedNeurons = new Set(workspace.selectedNeurons);
  const graphViewDataUpdates: Record<string, Partial<GraphViewerData>> = {};

  const groupModifications: Record<string, Set<string>> = {};
  const groupsToDelete = new Set<string>();

  for (const neuronId of workspace.selectedNeurons) {
    if (!isNeuronClass(neuronId, workspace)) {
      return;
    }

    newSplit.add(neuronId);
    newSelectedNeurons.delete(neuronId);

    const individualNeurons = workspace.getNeuronCellsByClass(neuronId);

    const basePosition = workspace.visibilities[neuronId][ViewerType.Graph]?.defaultPosition || {
      x: 0,
      y: 0,
    };
    const positions = calculateSplitPositions(individualNeurons, basePosition);

    updateGroupWithSplitNeurons(workspace, neuronId, individualNeurons, groupModifications, groupsToDelete);

    for (const neuronName of individualNeurons) {
      newSelectedNeurons.add(neuronName);
      graphViewDataUpdates[neuronName] = {
        defaultPosition: positions[neuronName],
        visibility: Visibility.Visible,
      };
    }

    for (const joinNeuronId of newJoin) {
      if (workspace.availableNeurons[joinNeuronId].nclass === neuronId) {
        newJoin.delete(joinNeuronId);
      }
    }

    graphViewDataUpdates[neuronId] = { visibility: Visibility.Unset };
  }

  workspace.customUpdate((draft) => {
    draft.selectedNeurons = newSelectedNeurons;

    for (const [groupId, neurons] of Object.entries(groupModifications)) {
      if (neurons.size === 0) {
        delete draft.neuronGroups[groupId];
      } else {
        draft.neuronGroups[groupId].neurons = neurons;
      }
    }
    for (const groupId of groupsToDelete) {
      delete draft.neuronGroups[groupId];
    }

    for (const [neuronName, update] of Object.entries(graphViewDataUpdates)) {
      if (!(neuronName in draft.visibilities)) {
        draft.visibilities[neuronName] = getDefaultViewerData(update.visibility);
      }
      if (update.defaultPosition !== undefined) {
        draft.visibilities[neuronName][ViewerType.Graph].defaultPosition = update.defaultPosition;
      }
    }
  });

  return { split: newSplit, join: newJoin };
};

export const processNeuronJoin = (workspace: Workspace, splitJoinState: SplitJoinState): SplitJoinState => {
  const newJoin = new Set(splitJoinState.join);
  const newSplit = new Set(splitJoinState.split);

  const newSelectedNeurons = new Set(workspace.selectedNeurons);
  const graphViewDataUpdates: Record<string, Partial<GraphViewerData>> = {};

  const groupModifications: Record<string, Set<string>> = {};
  const groupsToDelete = new Set<string>();

  for (const neuronId of workspace.selectedNeurons) {
    if (!isNeuronCell(neuronId, workspace)) {
      return;
    }
    const neuronClass = workspace.availableNeurons[neuronId].nclass;

    const individualNeurons = Object.values(workspace.availableNeurons)
      .filter((neuron) => neuron.nclass === neuronClass && neuron.name !== neuronClass)
      .map((neuron) => neuron.name);

    const classPosition = calculateMeanPosition(individualNeurons, workspace);

    if (!workspace.visibilities[neuronClass][ViewerType.Graph]?.defaultPosition) {
      graphViewDataUpdates[neuronClass] = {
        defaultPosition: classPosition,
        visibility: Visibility.Visible,
      };
    } else {
      graphViewDataUpdates[neuronClass] = {
        ...graphViewDataUpdates[neuronClass],
        visibility: Visibility.Visible,
      };
    }

    updateGroupWithJoinedNeurons(workspace, neuronId, neuronClass, individualNeurons, groupModifications, groupsToDelete);

    for (const neuronName of individualNeurons) {
      newSelectedNeurons.delete(neuronName);
      newJoin.add(neuronName);
      graphViewDataUpdates[neuronName] = { visibility: Visibility.Unset };
    }
    newSelectedNeurons.add(neuronClass);

    for (const splitNeuronId of newSplit) {
      if (workspace.availableNeurons[splitNeuronId].nclass === neuronClass) {
        newSplit.delete(splitNeuronId);
      }
    }
  }

  workspace.customUpdate((draft) => {
    draft.selectedNeurons = newSelectedNeurons;

    for (const [groupId, neurons] of Object.entries(groupModifications)) {
      if (neurons.size === 0) {
        delete draft.neuronGroups[groupId];
      } else {
        draft.neuronGroups[groupId].neurons = neurons;
      }
    }
    for (const groupId of groupsToDelete) {
      delete draft.neuronGroups[groupId];
    }

    for (const [neuronName, update] of Object.entries(graphViewDataUpdates)) {
      if (!(neuronName in draft.visibilities)) {
        draft.visibilities[neuronName] = getDefaultViewerData(update.visibility);
      }
      if (update.defaultPosition !== undefined) {
        draft.visibilities[neuronName][ViewerType.Graph].defaultPosition = update.defaultPosition;
      }
    }
  });

  return { split: newSplit, join: newJoin };
};

export const updateGroupWithSplitNeurons = (
  workspace: Workspace,
  neuronId: string,
  individualNeurons: string[],
  groupModifications: Record<string, Set<string>>,
  groupsToDelete: Set<string>,
) => {
  for (const groupId of Object.keys(workspace.neuronGroups)) {
    const group = workspace.neuronGroups[groupId];

    if (group.neurons.has(neuronId)) {
      // Replace the class neuron with individual neurons in the group
      groupModifications[groupId] = new Set(group.neurons);
      groupModifications[groupId].delete(neuronId);
      for (const indNeuronId of individualNeurons) {
        groupModifications[groupId].add(indNeuronId);
      }

      // Remove individual neurons from any other groups
      for (const otherGroupId of Object.keys(workspace.neuronGroups)) {
        if (otherGroupId !== groupId) {
          const otherGroup = workspace.neuronGroups[otherGroupId];
          for (const indNeuronId of individualNeurons) {
            if (otherGroup.neurons.has(indNeuronId)) {
              if (!groupModifications[otherGroupId]) {
                groupModifications[otherGroupId] = new Set(otherGroup.neurons);
              }
              groupModifications[otherGroupId].delete(indNeuronId);
              if (groupModifications[otherGroupId].size === 0) {
                groupsToDelete.add(otherGroupId);
              }
            }
          }
        }
      }
    }
  }
};

export const updateGroupWithJoinedNeurons = (
  workspace: Workspace,
  neuronId: string,
  neuronClass: string,
  individualNeurons: string[],
  groupModifications: Record<string, Set<string>>,
  groupsToDelete: Set<string>,
) => {
  // If the neuronId (cell) is part of a group, update the group
  for (const groupId of Object.keys(workspace.neuronGroups)) {
    const group = workspace.neuronGroups[groupId];

    if (group.neurons.has(neuronId)) {
      // Add the class neuron to the group of the selected cell
      if (!groupModifications[groupId]) {
        groupModifications[groupId] = new Set(group.neurons);
      }
      groupModifications[groupId].add(neuronClass);

      // Remove individual neurons from any groups they belong to
      for (const neuronName of individualNeurons) {
        for (const otherGroupId of Object.keys(workspace.neuronGroups)) {
          if (workspace.neuronGroups[otherGroupId].neurons.has(neuronName)) {
            if (!groupModifications[otherGroupId]) {
              groupModifications[otherGroupId] = new Set(workspace.neuronGroups[otherGroupId].neurons);
            }
            groupModifications[otherGroupId].delete(neuronName);
            if (groupModifications[otherGroupId].size === 0) {
              groupsToDelete.add(otherGroupId);
            }
          }
        }
      }

      // Remove the individual neurons from the group
      for (const neuronName of individualNeurons) {
        groupModifications[groupId].delete(neuronName);
      }
    }
  }
};
