import {Dataset, Neuron, NeuronGroup, ViewerSynchronizationPair, ViewerType, Workspace} from "../models.ts";

export function activateNeuron(workspace: Workspace, neuron: Neuron): Workspace {
    return {
        ...workspace,
        neurons: {
            ...workspace.neurons,
            [neuron.id]: neuron
        }
    };
}

export function deactivateNeuron(workspace: Workspace, neuronId: string): Workspace {
    const newNeurons = {...workspace.neurons};
    delete newNeurons[neuronId];
    return {
        ...workspace,
        neurons: newNeurons
    };
}

export function activateDataset(workspace: Workspace, dataset: Dataset): Workspace {
    return {
        ...workspace,
        datasets: {
            ...workspace.datasets,
            [dataset.id]: dataset
        }
    };
}

export function deactivateDataset(workspace: Workspace, datasetId: string): Workspace {
    const newDatasets = {...workspace.datasets};
    delete newDatasets[datasetId];
    return {
        ...workspace,
        datasets: newDatasets
    };
}

export function changeViewerVisibility(workspace: Workspace, viewerId: ViewerType, isVisible: boolean): Workspace {
    if (workspace.viewers[viewerId] === undefined) {
        throw new Error('Viewer not found');
    }
    return {
        ...workspace,
        viewers: {
            ...workspace.viewers,
            [viewerId]: isVisible,
        }
    };
}


export function createNeuronGroup(workspace: Workspace, neuronGroup: NeuronGroup): Workspace {
    return {
        ...workspace,
        neuronGroups: {
            ...workspace.neuronGroups,
            [neuronGroup.id]: neuronGroup
        }
    };
}

export function addNeuronToGroup(workspace: Workspace, neuronId: string, groupId: string): Workspace {
    const neuron = workspace.neurons[neuronId];
    if (!neuron) {
        throw new Error('Neuron not found');
    }
    const group = workspace.neuronGroups[groupId];
    if (!group) {
        throw new Error('Neuron group not found');
    }

    const updatedNeurons = new Set(group.neurons);
    updatedNeurons.add(neuronId);

    return {
        ...workspace,
        neuronGroups: {
            ...workspace.neuronGroups,
            [groupId]: {
                ...group,
                neurons: updatedNeurons
            }
        }
    };
}

export function updateViewerSynchronizationStatus(workspace: Workspace, pair: ViewerSynchronizationPair, isActive: boolean): Workspace {
    return {
        ...workspace,
        synchronizations: {
            ...workspace.synchronizations,
            [pair]: isActive
        }
    };
}