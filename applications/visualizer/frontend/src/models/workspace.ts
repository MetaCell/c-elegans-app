import {produce, immerable} from "immer"
import {configureStore} from "@reduxjs/toolkit";
import {NeuronGroup, ViewerSynchronizationPair, ViewerType} from "./models.ts";
import getLayoutManagerAndStore from "../layout-manager/layoutManagerFactory.ts";
import {Dataset, Neuron} from "../rest";

export class Workspace {
    [immerable] = true

    id: string;
    name: string;
    activeDatasets: Record<string, Dataset>;
    activeNeurons: Record<string, Neuron>;
    highlightedNeuron: string | undefined;
    viewers: Record<ViewerType, boolean>;
    synchronizations: Record<ViewerSynchronizationPair, boolean>;
    neuronGroups: Record<string, NeuronGroup>;

    store: ReturnType<typeof configureStore>;
    layoutManager: any;

    updateContext: (workspace: Workspace) => void;

    constructor(id: string, name: string,
                activeDatasets: Record<string, Dataset>,
                activeNeurons: Record<string, Neuron>,
                updateContext: (workspace: Workspace) => void) {
        this.id = id;
        this.name = name;
        this.activeDatasets = activeDatasets || {};
        this.activeNeurons = activeNeurons || {};
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
        this.neuronGroups = {}

        const {layoutManager, store} = getLayoutManagerAndStore(id);
        this.layoutManager = layoutManager
        this.store = store
        this.updateContext = updateContext;
    }

        activateNeuron(neuron: Neuron): void {
        const updated = produce(this, (draft: Workspace) => {
            draft.activeNeurons[neuron.name] = neuron;
        });
        this.updateContext(updated);
    }

    deactivateNeuron(neuronId: string): void {
        const updated = produce(this, (draft: Workspace) => {
            delete draft.activeNeurons[neuronId];
        });
        this.updateContext(updated);
    }

    activateDataset(dataset: Dataset): void {
        const updated = produce(this, (draft: Workspace) => {
            draft.activeDatasets[dataset.id] = dataset;
        });
        this.updateContext(updated);
    }

    deactivateDataset(datasetId: string): void {
        const updated = produce(this, (draft: Workspace) => {
            delete draft.activeDatasets[datasetId];
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
            if (!draft.activeNeurons[neuronId]) {
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
