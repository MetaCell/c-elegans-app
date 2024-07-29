import type { LayoutManager } from "@metacell/geppetto-meta-client/common/layout/LayoutManager";
import type { configureStore } from "@reduxjs/toolkit";
import { immerable, produce } from "immer";
import type { GlobalContextType } from "../contexts/GlobalContext.tsx";
import { getWorkspaceActiveDatasets } from "../helpers/workspaceHelper.ts";
import getLayoutManagerAndStore from "../layout-manager/layoutManagerFactory.ts";
import { type Dataset, type Neuron, NeuronsService } from "../rest";
import { type NeuronGroup, ViewerSynchronizationPair, ViewerType } from "./models.ts";

export class Workspace {
  [immerable] = true;

  id: string;
  name: string;
  // datasetID -> Dataset
  activeDatasets: Record<string, Dataset>;
  // neuronID -> Neurons
  availableNeurons: Record<string, Neuron>;
  // neuronId
  activeNeurons: Set<string>;
  highlightedNeuron: string | undefined;
  viewers: Record<ViewerType, boolean>;
  synchronizations: Record<ViewerSynchronizationPair, boolean>;
  neuronGroups: Record<string, NeuronGroup>;

  store: ReturnType<typeof configureStore>;
  layoutManager: LayoutManager;
  updateContext: (workspace: Workspace) => void;
  globalContext: GlobalContextType;
  constructor(
    id: string,
    name: string,
    datasetIds: Set<string>,
    activeNeurons: Set<string>,
    updateContext: (workspace: Workspace) => void,
    globalContext: GlobalContextType,
  ) {
    this.id = id;
    this.name = name;
    this.activeDatasets = {};
    this.availableNeurons = {};
    this.activeNeurons = activeNeurons;
    this.highlightedNeuron = undefined;
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
    this.globalContext = globalContext;

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

  async _initializeActiveDatasets(datasetIds: Set<string>) {
    const datasets = getWorkspaceActiveDatasets(this.globalContext.datasets, datasetIds);
    const updated: Workspace = produce(this, (draft: Workspace) => {
      draft.activeDatasets = datasets;
    });

    const updatedWithNeurons = await this._getAvailableNeurons(updated);
    this.updateContext(updatedWithNeurons);
  }
  async _getAvailableNeurons(updatedWorkspace: Workspace): Promise<Workspace> {
    try {
      const datasetIds = Object.keys(updatedWorkspace.activeDatasets);
      const neuronArrays = await NeuronsService.searchCells({ datasetIds });

      const uniqueNeurons = new Set<Neuron>();

      // Flatten and deduplicate neurons
      for (const neuron of neuronArrays.flat()) {
        uniqueNeurons.add(neuron);
        // Add class neuron as well
        const classNeuron = { ...neuron, name: neuron.nclass };
        uniqueNeurons.add(classNeuron);
      }

      return produce(updatedWorkspace, (draft: Workspace) => {
        // Reset the availableNeurons map
        draft.availableNeurons = {};

        // Populate availableNeurons with unique neurons
        for (const neuron of uniqueNeurons) {
          draft.availableNeurons[neuron.name] = neuron;
        }
      });
    } catch (error) {
      console.error("Failed to fetch neurons:", error);
      return updatedWorkspace;
    }
  }
}
