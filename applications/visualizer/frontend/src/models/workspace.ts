import {produce, immerable} from "immer"
import {configureStore} from "@reduxjs/toolkit";
import {NeuronGroup, ViewerSynchronizationPair, ViewerType} from "./models.ts";
import getLayoutManagerAndStore from "../layout-manager/layoutManagerFactory.ts";
import {Dataset, DatasetsService, Neuron} from "../rest";
import {fetchDatasets} from "../helpers/workspaceHelper.ts";

export class Workspace {
    [immerable] = true

    id: string;
    name: string;
    // datasetID -> Dataset
    activeDatasets: Record<string, Dataset>;
    // neuronID -> Neurons
    neuronsAvailable: Record<string, Neuron>;
    // neuronId
    activeNeurons: Set<string>;
    highlightedNeuron: string | undefined;
    viewers: Record<ViewerType, boolean>;
    synchronizations: Record<ViewerSynchronizationPair, boolean>;
    neuronGroups: Record<string, NeuronGroup>;

    store: ReturnType<typeof configureStore>;
    layoutManager: any;

    updateContext: (workspace: Workspace) => void;

    constructor(id: string, name: string,
                datasetIds: Set<string>,
                activeNeurons: Set<string>,
                updateContext: (workspace: Workspace) => void) {
        this.id = id;
        this.name = name;
        this.activeDatasets = {};
        this.neuronsAvailable = {};
        this.activeNeurons = activeNeurons;
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

        this._initializeActiveDatasets(datasetIds);
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

    async activateDataset(dataset: Dataset): void {
        let updated = produce(this, (draft: Workspace) => {
            draft.activeDatasets[dataset.id] = dataset;
        });
        updated = await this._getAvailableNeurons(updated);
        this.updateContext(updated);
    }

    async deactivateDataset(datasetId: string): void {
        let updated = produce(this, (draft: Workspace) => {
            delete draft.activeDatasets[datasetId];
        });
        updated = await this._getAvailableNeurons(updated);
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

    async _initializeActiveDatasets(datasetIds: Set<string>) {
        const datasets = await fetchDatasets(datasetIds);
        let updated = produce(this, (draft: Workspace) => {
            draft.activeDatasets = datasets;
        });
        updated = await this._getAvailableNeurons(updated);
        this.updateContext(updated);
    }

    async _getAvailableNeurons(updatedWorkspace: Workspace): Promise<Workspace> {
        try {
            const neuronPromises = Object.keys(updatedWorkspace.activeDatasets).map(datasetId =>
                DatasetsService.getDatasetNeurons({dataset: datasetId})
            );

            const neuronArrays = await Promise.all(neuronPromises);

            return produce(updatedWorkspace, (draft: Workspace) => {
                // Reset the neuronsAvailable map
                draft.neuronsAvailable = {};

                // Populate neuronsAvailable with neurons from all active datasets
                neuronArrays.forEach(neurons => {
                    neurons.forEach((neuron: Neuron) => {
                        draft.neuronsAvailable[neuron.name] = neuron;
                    });
                });
            });

        } catch (error) {
            console.error('Failed to fetch neurons:', error);
            return updatedWorkspace;
        }
    }


}
