import type { LayoutManager } from "@metacell/geppetto-meta-client/common/layout/LayoutManager";
import type { configureStore } from "@reduxjs/toolkit";
import { current, immerable, produce, produceWithPatches } from "immer";
import getLayoutManagerAndStore from "../layout-manager/layoutManagerFactory";
import { type Dataset, type Neuron, NeuronsService } from "../rest";
import { GlobalError } from "./Error.ts";
import { type EnhancedNeuron, type NeuronGroup, ViewerSynchronizationPair, ViewerType } from "./models";

function getCallerName(): string {
  try {
    throw new Error();
  } catch (e) {
    // matches this function, the caller and the parent
    const allMatches = e.stack.match(/(\w+)@|at (\w+\.?\w+?) \(/g);
    // match parent function name
    const parentMatches = allMatches[2].match(/(\w+)@|at (\w+\.?\w+?) \(/);
    // return only name
    return parentMatches[1] || parentMatches[2];
  }
}

function triggerUpdate<T extends Workspace>(_: any, key: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (this: T, ...args: any[]): T {
    const updated = produce(this, (draft: any) => {
      originalMethod.apply(draft, args);
    });
    this.updateContext(updated);
    return updated;
  };

  return descriptor;
}

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
      [ViewerType.Graph]: false,
      [ViewerType.ThreeD]: true,
      [ViewerType.EM]: false,
      [ViewerType.InstanceDetails]: false,
    };
    this.synchronizations = {
      [ViewerSynchronizationPair.Graph_InstanceDetails]: true,
      [ViewerSynchronizationPair.Graph_ThreeD]: true,
      [ViewerSynchronizationPair.ThreeD_EM]: true,
    };
    this.neuronGroups = {};

    const { layoutManager, store } = getLayoutManagerAndStore(id);
    this.layoutManager = layoutManager;
    this.store = store;
    this.updateContext = updateContext;

    this._initializeAvailableNeurons();
  }

  // activateNeuron(neuron: Neuron): void {
  //   const updated = produce(this, (draft: Workspace) => {
  //     draft.activeNeurons.add(neuron.name);
  //     // Set isInteractant to true if the neuron exists in availableNeurons
  //     if (draft.availableNeurons[neuron.name]) {
  //       draft.availableNeurons[neuron.name].isInteractant = true;
  //     }
  //   });

  //   this.updateContext(updated);
  // }

  // deactivateNeuron(neuronId: string): void {
  //   const updated = produce(this, (draft: Workspace) => {
  //     draft.activeNeurons.delete(neuronId);
  //   });
  //   this.updateContext(updated);
  // }

  @triggerUpdate
  activateNeuron(neuron: Neuron): void {
    this.activeNeurons.add(neuron.name);
    console.log("STATUS ACT", this);

    this.deactivateNeuron(neuron.name);
    this.activeNeurons.add(neuron.name);
    console.log("STATUS ACT", this);

    // Set isInteractant to true if the neuron exists in availableNeurons
    if (this.availableNeurons[neuron.name]) {
      this.availableNeurons[neuron.name].isInteractant = true;
    }
  }

  @triggerUpdate
  deactivateNeuron(neuronId: string): void {
    console.log("STATUS DEACT", this);
    this.activeNeurons.delete(neuronId);
  }

  deleteNeuron(neuronId: string): void {
    const updated = produce(this, (draft: Workspace) => {
      // Remove the neuron from activeNeurons
      draft.activeNeurons.delete(neuronId);

      // Set isInteractant to false if the neuron exists in availableNeurons
      if (draft.availableNeurons[neuronId]) {
        draft.availableNeurons[neuronId].isInteractant = false;
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

  @triggerUpdate
  toggleSelectedNeuron(neuronId: string) {
    if (this.selectedNeurons.has(neuronId)) {
      this.selectedNeurons.delete(neuronId);
    } else {
      this.selectedNeurons.add(neuronId);
    }
    return this;
  }

  setActiveNeurons(newActiveNeurons: Set<string>): void {
    const updated = produce(this, (draft: Workspace) => {
      draft.activeNeurons = newActiveNeurons;
    });
    this.updateContext(updated);
  }

  @triggerUpdate
  clearSelectedNeurons() {
    this.selectedNeurons.clear();
    return this;
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

  @triggerUpdate
  createNeuronGroup(neuronGroup: NeuronGroup) {
    this.neuronGroups[neuronGroup.id] = neuronGroup;
    return this;
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
      const neuronArrays = await NeuronsService.searchCells({ datasetIds });

      // Flatten and add neurons classes
      const uniqueNeurons = new Set<Neuron>();
      const neuronsClass: Record<string, Neuron> = {};
      for (const neuron of neuronArrays.flat()) {
        uniqueNeurons.add(neuron);

        const className = neuron.nclass;
        if (!(className in neuronsClass)) {
          const neuronClass = { ...neuron, name: className };
          neuronsClass[className] = neuronClass;
          uniqueNeurons.add(neuronClass);
        } else {
          neuronsClass[className].model3DUrls.push(...neuron.model3DUrls);
        }
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
                visibility: previousNeuron?.viewerData[ViewerType.Graph]?.visibility || false,
              },
              [ViewerType.ThreeD]: previousNeuron?.viewerData[ViewerType.ThreeD] || {},
              [ViewerType.EM]: previousNeuron?.viewerData[ViewerType.EM] || {},
              [ViewerType.InstanceDetails]: previousNeuron?.viewerData[ViewerType.InstanceDetails] || {},
            },
            isInteractant: previousNeuron?.isInteractant ?? draft.activeNeurons.has(neuron.name),
          };

          draft.availableNeurons[neuron.name] = enhancedNeuron;
        }
      });
    } catch (error) {
      throw new GlobalError("Failed to fetch neurons:");
    }
  }

  customUpdate(updateFunction: (draft: Workspace) => void): void {
    const updated = produce(this, updateFunction);
    this.updateContext(updated);
  }
}
