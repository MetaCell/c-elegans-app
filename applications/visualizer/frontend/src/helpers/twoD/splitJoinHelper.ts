import {GraphViewerData, Visibility} from "../../models/models.ts";
import {Workspace, ViewerType} from "../../models";
import {calculateMeanPosition, calculateSplitPositions, isNeuronClass, isNeuronCell} from "./twoDHelpers.ts";
import {Core} from "cytoscape";


interface SplitJoinState {
    split: Set<string>;
    join: Set<string>;
}

export const processNeuronSplit = (
    workspace: Workspace,
    splitJoinState: SplitJoinState
): SplitJoinState => {
    const newSplit = new Set(splitJoinState.split);
    const newJoin = new Set(splitJoinState.join);

    const newSelectedNeurons = new Set(workspace.selectedNeurons);
    const graphViewDataUpdates: Record<string, Partial<GraphViewerData>> = {};

    const groupModifications: Record<string, Set<string>> = {};
    const groupsToDelete = new Set<string>();

    workspace.selectedNeurons.forEach((neuronId) => {
        if (!isNeuronClass(neuronId, workspace)) {
            return
        }

        newSplit.add(neuronId);
        newSelectedNeurons.delete(neuronId);

        const individualNeurons = Object.values(workspace.availableNeurons)
            .filter((neuron) => neuron.nclass === neuronId && neuron.nclass !== neuron.name)
            .map((neuron) => neuron.name);

        const basePosition = workspace.availableNeurons[neuronId].viewerData[ViewerType.Graph]?.defaultPosition || {
            x: 0,
            y: 0,
        };
        const positions = calculateSplitPositions(individualNeurons, basePosition);

        updateGroupWithSplitNeurons(workspace, neuronId, individualNeurons, groupModifications, groupsToDelete);

        individualNeurons.forEach((neuronName) => {
            newSelectedNeurons.add(neuronName);
            graphViewDataUpdates[neuronName] = {
                defaultPosition: positions[neuronName],
                visibility: Visibility.Visible,
            };
        });

        newJoin.forEach((joinNeuronId) => {
            if (workspace.availableNeurons[joinNeuronId].nclass === neuronId) {
                newJoin.delete(joinNeuronId);
            }
        });

        graphViewDataUpdates[neuronId] = {visibility: Visibility.Unset};
    });

    workspace.customUpdate((draft) => {
        draft.selectedNeurons = newSelectedNeurons;

        Object.entries(groupModifications).forEach(([groupId, neurons]) => {
            if (neurons.size === 0) {
                delete draft.neuronGroups[groupId];
            } else {
                draft.neuronGroups[groupId].neurons = neurons;
            }
        });
        groupsToDelete.forEach((groupId) => {
            delete draft.neuronGroups[groupId];
        });

        Object.entries(graphViewDataUpdates).forEach(([neuronName, update]) => {
            if (draft.availableNeurons[neuronName]) {
                if (update.defaultPosition !== undefined) {
                    draft.availableNeurons[neuronName].viewerData[ViewerType.Graph].defaultPosition = update.defaultPosition;
                }
                draft.availableNeurons[neuronName].viewerData[ViewerType.Graph].visibility = update.visibility;
            }
        });
    });

    return {split: newSplit, join: newJoin};
};

export const processNeuronJoin = (
    workspace: Workspace,
    splitJoinState: SplitJoinState
): SplitJoinState => {
    const newJoin = new Set(splitJoinState.join);
    const newSplit = new Set(splitJoinState.split);

    const newSelectedNeurons = new Set(workspace.selectedNeurons);
    const graphViewDataUpdates: Record<string, Partial<GraphViewerData>> = {};

    const groupModifications: Record<string, Set<string>> = {};
    const groupsToDelete = new Set<string>();

    workspace.selectedNeurons.forEach((neuronId) => {
        if (!isNeuronCell(neuronId, workspace)) {
            return
        }
        const neuronClass = workspace.availableNeurons[neuronId].nclass;

        const individualNeurons = Object.values(workspace.availableNeurons)
            .filter((neuron) => neuron.nclass === neuronClass && neuron.name !== neuronClass)
            .map((neuron) => neuron.name);

        const classPosition = calculateMeanPosition(individualNeurons, workspace);

        if (!workspace.availableNeurons[neuronClass].viewerData[ViewerType.Graph]?.defaultPosition) {
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

        individualNeurons.forEach((neuronName) => {
            newSelectedNeurons.delete(neuronName);
            newJoin.add(neuronName);
            graphViewDataUpdates[neuronName] = {visibility: Visibility.Unset};
        });
        newSelectedNeurons.add(neuronClass);

        newSplit.forEach((splitNeuronId) => {
            if (workspace.availableNeurons[splitNeuronId].nclass === neuronClass) {
                newSplit.delete(splitNeuronId);
            }
        });
    });

    workspace.customUpdate((draft) => {
        draft.selectedNeurons = newSelectedNeurons;

        Object.entries(groupModifications).forEach(([groupId, neurons]) => {
            if (neurons.size === 0) {
                delete draft.neuronGroups[groupId];
            } else {
                draft.neuronGroups[groupId].neurons = neurons;
            }
        });
        groupsToDelete.forEach((groupId) => {
            delete draft.neuronGroups[groupId];
        });

        Object.entries(graphViewDataUpdates).forEach(([neuronName, update]) => {
            if (draft.availableNeurons[neuronName]) {
                if (update.defaultPosition !== undefined) {
                    draft.availableNeurons[neuronName].viewerData[ViewerType.Graph].defaultPosition = update.defaultPosition;
                }
                draft.availableNeurons[neuronName].viewerData[ViewerType.Graph].visibility = update.visibility;
            }
        });
    });

    return {split: newSplit, join: newJoin};
};

export const updateGroupWithSplitNeurons = (
    workspace: Workspace,
    neuronId: string,
    individualNeurons: string[],
    groupModifications: Record<string, Set<string>>,
    groupsToDelete: Set<string>
) => {
    Object.keys(workspace.neuronGroups).forEach((groupId) => {
        const group = workspace.neuronGroups[groupId];

        if (group.neurons.has(neuronId)) {
            // Replace the class neuron with individual neurons in the group
            groupModifications[groupId] = new Set(group.neurons);
            groupModifications[groupId].delete(neuronId);
            individualNeurons.forEach((indNeuronId) => groupModifications[groupId].add(indNeuronId));

            // Remove individual neurons from any other groups
            Object.keys(workspace.neuronGroups).forEach((otherGroupId) => {
                if (otherGroupId !== groupId) {
                    const otherGroup = workspace.neuronGroups[otherGroupId];
                    individualNeurons.forEach((indNeuronId) => {
                        if (otherGroup.neurons.has(indNeuronId)) {
                            if (!groupModifications[otherGroupId]) {
                                groupModifications[otherGroupId] = new Set(otherGroup.neurons);
                            }
                            groupModifications[otherGroupId].delete(indNeuronId);
                            if (groupModifications[otherGroupId].size === 0) {
                                groupsToDelete.add(otherGroupId);
                            }
                        }
                    });
                }
            });
        }
    });
};

export const updateGroupWithJoinedNeurons = (
    workspace: Workspace,
    neuronId: string,
    neuronClass: string,
    individualNeurons: string[],
    groupModifications: Record<string, Set<string>>,
    groupsToDelete: Set<string>
) => {
    // If the neuronId (cell) is part of a group, update the group
    Object.keys(workspace.neuronGroups).forEach((groupId) => {
        const group = workspace.neuronGroups[groupId];

        if (group.neurons.has(neuronId)) {
            // Add the class neuron to the group of the selected cell
            if (!groupModifications[groupId]) {
                groupModifications[groupId] = new Set(group.neurons);
            }
            groupModifications[groupId].add(neuronClass);

            // Remove individual neurons from any groups they belong to
            individualNeurons.forEach((neuronName) => {
                Object.keys(workspace.neuronGroups).forEach((otherGroupId) => {
                    if (workspace.neuronGroups[otherGroupId].neurons.has(neuronName)) {
                        if (!groupModifications[otherGroupId]) {
                            groupModifications[otherGroupId] = new Set(workspace.neuronGroups[otherGroupId].neurons);
                        }
                        groupModifications[otherGroupId].delete(neuronName);
                        if (groupModifications[otherGroupId].size === 0) {
                            groupsToDelete.add(otherGroupId);
                        }
                    }
                });
            });

            // Remove the individual neurons from the group
            individualNeurons.forEach((neuronName) => {
                groupModifications[groupId].delete(neuronName);
            });
        }
    });
};


export function areAllSplitNeuronsInGraph(cy: Core, splitJoinState: SplitJoinState,) {
    const missingNeurons = Array.from(splitJoinState.split).filter(neuronId => !cy.getElementById(neuronId).length);

    return missingNeurons.length == 0
}