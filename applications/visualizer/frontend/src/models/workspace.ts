import type {LayoutManager} from "@metacell/geppetto-meta-client/common/layout/LayoutManager";
import type {configureStore} from "@reduxjs/toolkit";
import {immerable, produce} from "immer";
import getLayoutManagerAndStore from "../layout-manager/layoutManagerFactory";
import {type Dataset, type Neuron, NeuronsService} from "../rest";
import {type EnhancedNeuron, type NeuronGroup, ViewerSynchronizationPair, ViewerType, Visibility} from "./models";

export class Workspace {
    [immerable] = true;

    id: string;
    name: string;
    // datasetID -> Dataset
    activeDatasets: Record<string, Dataset>;
    // neuronID -> Neurons
    availableNeurons: Record<string, EnhancedNeuron>;
    // neuronId
    activeNeurons: Set<string>;
    selectedNeurons: Set<string>;
    viewers: Record<ViewerType, boolean>;
    synchronizations: Record<ViewerSynchronizationPair, boolean>;
    neuronGroups: Record<string, NeuronGroup>;

    store: ReturnType<typeof configureStore>;
    layoutManager: LayoutManager;
    updateContext: (workspace: Workspace) => void;

    constructor(id: string, name: string, activeDatasets: Record<string, Dataset>, activeNeurons: Set<string>, updateContext: (workspace: Workspace) => void) {
        this.id = id;
        this.name = name;
        this.activeDatasets = activeDatasets;
        this.availableNeurons = {};
        this.activeNeurons = activeNeurons || new Set();
        this.selectedNeurons = new Set();
        this.viewers = {
            [ViewerType.Graph]: true,
            [ViewerType.ThreeD]: false,
            [ViewerType.EM]: false,
            [ViewerType.InstanceDetails]: false,
        };
        this.synchronizations = {
            [ViewerSynchronizationPair.Graph_InstanceDetails]: true,
            [ViewerSynchronizationPair.Graph_ThreeD]: true,
            [ViewerSynchronizationPair.ThreeD_EM]: true,
        };
        this.neuronGroups = {};

        const {layoutManager, store} = getLayoutManagerAndStore(id);
        this.layoutManager = layoutManager;
        this.store = store;
        this.updateContext = updateContext;

        this._initializeAvailableNeurons();
    }

    activateNeuron(neuron: Neuron): void {
        const updated = produce(this, (draft: Workspace) => {
            draft.activeNeurons.add(neuron.name);
        });

        this.updateContext(updated);
    }

    deactivateNeuron(neuronId: string): void {
        const updated = produce(this, (draft: Workspace) => {
            draft.activeNeurons.delete(neuronId);
        });
        this.updateContext(updated);
    }

    hideNeuron(neuronId: string): void {
        const updated = produce(this, (draft: Workspace) => {
            if (draft.availableNeurons[neuronId]) {
                draft.availableNeurons[neuronId].isVisible = false
                draft.selectedNeurons.delete(neuronId);
                // todo: add actions for other viewers
                draft.availableNeurons[neuronId].viewerData[ViewerType.Graph].visibility = Visibility.Hidden;
            }
        });
        this.updateContext(updated);
    }

    showNeuron(neuronId: string): void {
        const updated = produce(this, (draft: Workspace) => {
            if (draft.availableNeurons[neuronId]) {
                draft.availableNeurons[neuronId].isVisible = true
                // todo: add actions for other viewers
                draft.availableNeurons[neuronId].viewerData[ViewerType.Graph].visibility = Visibility.Visible;
            }
        });
        this.updateContext(updated);
    }

    async activateDataset(dataset: Dataset): Promise<void> {
        const updated: Workspace = produce(this, (draft: Workspace) => {
            draft.activeDatasets[dataset.id] = dataset;
        });
        const updatedWithNeurons = await this._getAvailableNeurons(updated);
        this.updateContext(updatedWithNeurons);
    }

    async deactivateDataset(datasetId: string): Promise<void> {
        const updated: Workspace = produce(this, (draft: Workspace) => {
            delete draft.activeDatasets[datasetId];
        });

        const updatedWithNeurons = await this._getAvailableNeurons(updated);
        this.updateContext(updatedWithNeurons);
    }

    toggleSelectedNeuron(neuronId: string): void {
        const updated = produce(this, (draft: Workspace) => {
            if (draft.selectedNeurons.has(neuronId)) {
                draft.selectedNeurons.delete(neuronId);
            } else {
                draft.selectedNeurons.add(neuronId);
            }
        });
        this.updateContext(updated);
    }

    setActiveNeurons(newActiveNeurons: Set<string>): void {
        const updated = produce(this, (draft: Workspace) => {
            draft.activeNeurons = newActiveNeurons;
        });
        this.updateContext(updated);
    }

    clearSelectedNeurons(): void {
        const updated = produce(this, (draft: Workspace) => {
            draft.selectedNeurons.clear();
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
                throw new Error("Neuron not found");
            }
            const group = draft.neuronGroups[groupId];
            if (!group) {
                throw new Error("Neuron group not found");
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
                throw new Error("Viewer not found");
            }
            draft.viewers[viewerId] = isVisible;
        });
        this.updateContext(updated);
    }

    async _initializeAvailableNeurons() {
        const updatedWithNeurons = await this._getAvailableNeurons(this);
        this.updateContext(updatedWithNeurons);
    }

    async _getAvailableNeurons(updatedWorkspace: Workspace): Promise<Workspace> {
        try {
            const datasetIds = Object.keys(updatedWorkspace.activeDatasets);
            const neuronArrays = await NeuronsService.searchCells({datasetIds});

            const uniqueNeurons = new Set<Neuron>();

            // Flatten and deduplicate neurons
            for (const neuronArray of neuronArrays.flat()) {
                uniqueNeurons.add(neuronArray);
                const classNeuron = {...neuronArray, name: neuronArray.nclass};
                uniqueNeurons.add(classNeuron);
            }

            return produce(updatedWorkspace, (draft: Workspace) => {
                draft.availableNeurons = {};
                for (const neuron of uniqueNeurons) {
                    const previousNeuron = draft.availableNeurons[neuron.name];

                    const enhancedNeuron: EnhancedNeuron = {
                        ...neuron,
                        viewerData: {
                            [ViewerType.Graph]: {
                                defaultPosition: previousNeuron?.viewerData[ViewerType.Graph]?.defaultPosition || null,
                                visibility: previousNeuron?.viewerData[ViewerType.Graph]?.visibility !== undefined
                                    ? previousNeuron.viewerData[ViewerType.Graph].visibility
                                    : draft.activeNeurons.has(neuron.name)
                                        ? Visibility.Visible
                                        : Visibility.Unset,
                            },
                            [ViewerType.ThreeD]: previousNeuron?.viewerData[ViewerType.ThreeD] || {},
                            [ViewerType.EM]: previousNeuron?.viewerData[ViewerType.EM] || {},
                            [ViewerType.InstanceDetails]: previousNeuron?.viewerData[ViewerType.InstanceDetails] || {},
                        },
                        isVisible: previousNeuron?.isVisible ?? draft.activeNeurons.has(neuron.name),
                    };

                    draft.availableNeurons[neuron.name] = enhancedNeuron;
                }
            });
        } catch (error) {
            console.error("Failed to fetch neurons:", error);
            return updatedWorkspace;
        }
    }

    customUpdate(updateFunction: (draft: Workspace) => void): void {
        const updated = produce(this, updateFunction);
        this.updateContext(updated);
    }

    getHiddenNeurons() {
        const hiddenNodes = new Set<string>();

        this.activeNeurons.forEach(neuronId => {
            const neuron = this.availableNeurons[neuronId];
            if (neuron && !neuron.isVisible) {
                hiddenNodes.add(neuronId);
            }
        });

        return hiddenNodes;
    }
}
