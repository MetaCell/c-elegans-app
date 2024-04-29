import {produce, immerable} from "immer"
import {configureStore} from "@reduxjs/toolkit";
import {NeuronGroup, ViewerSynchronizationPair, ViewerType} from "./models.ts";
import getLayoutManagerAndStore from "../layout-manager/layoutManagerFactory.ts";

export class Workspace {
    [immerable] = true

    id: string;
    name: string;
    activeDatasets: Set<string>;
    activeNeurons: Set<string>;
    highlightedNeuron: string | undefined;
    viewers: Record<ViewerType, boolean>;
    synchronizations: Record<ViewerSynchronizationPair, boolean>;
    neuronGroups: Record<string, NeuronGroup>;

    store: ReturnType<typeof configureStore>;
    layoutManager: unknown;

    updateContext: (workspace: Workspace) => void;

    constructor(id: string, name: string, updateContext: (workspace: Workspace) => void) {
        this.id = id;
        this.name = name;
        this.activeDatasets = new Set();
        this.activeNeurons = new Set();
        this.highlightedNeuron = undefined;
        this.viewers = {
            [ViewerType.Graph]: true,
            [ViewerType.ThreeD]: true,
            [ViewerType.EM]: false,
            [ViewerType.InstanceDetails]: false,
        }
        this.synchronizations = {
            [ViewerSynchronizationPair.Graph_InstanceDetails]: true,
            [ViewerSynchronizationPair.Graph_ThreeD]: true,
            [ViewerSynchronizationPair.ThreeD_EM]: true
        }

        const {layoutManager, store} = getLayoutManagerAndStore(id);
        this.layoutManager = layoutManager
        this.store = store
        this.updateContext = updateContext;
    }

    activateNeuron(neuronId: string): void {
        const updated = produce(this, (draft: Workspace) => {
            draft.activeNeurons.add(neuronId);
        });
        this.updateContext(updated);
    }

    deactivateNeuron(neuronId: string): void {
        const updated = produce(this, (draft: Workspace) => {
            draft.activeNeurons.delete(neuronId);
        });
        this.updateContext(updated);
    }

    activateDataset(datasetId: string): void {
        const updated = produce(this, (draft: Workspace) => {
            draft.activeDatasets.add(datasetId);
        });
        this.updateContext(updated);
    }

    deactivateDataset(datasetId: string): void {
        const updated = produce(this, (draft: Workspace) => {
            draft.activeDatasets.delete(datasetId);
        });
        this.updateContext(updated);
    }

    highlightNeuron(neuronId: string): void {
        const updated = produce(this, (draft: Workspace) => {
            draft.highlightedNeuron = neuronId;
        });
        this.updateContext(updated);
    }

    updateViewerSynchronizationStatus(pair: ViewerSynchronizationPair, isActive: boolean): void {
        const updated = produce(this, (draft: Workspace) => {
            draft.synchronizations[pair] = isActive;
        });
        this.updateContext(updated);
    }

    addNeuronToGroup(neuronId: string, groupId: string): void {
        const updated = produce(this, (draft: Workspace) => {
            if (!draft.activeNeurons.has(neuronId)) {
                throw new Error('Neuron not found');
            }
            const group = draft.neuronGroups[groupId];
            if (!group) {
                throw new Error('Neuron group not found');
            }
            group.neurons.add(neuronId);
        });
        this.updateContext(updated);
    }

    createNeuronGroup(neuronGroup: NeuronGroup): void {
        const updated = produce(this, (draft: Workspace) => {
            draft.neuronGroups[neuronGroup.id] = neuronGroup;
        });
        this.updateContext(updated);
    }

    changeViewerVisibility(viewerId: ViewerType, isVisible: boolean): void {
        const updated = produce(this, (draft: Workspace) => {
            if (draft.viewers[viewerId] === undefined) {
                throw new Error('Viewer not found');
            }
            draft.viewers[viewerId] = isVisible;
        });
        this.updateContext(updated);
    }
}
