import type { LayoutManager } from "@metacell/geppetto-meta-client/common/layout/LayoutManager";
import type { configureStore } from "@reduxjs/toolkit";
import { createDraft, finishDraft, immerable, isDraft, produce } from "immer";
import getLayoutManagerAndStore from "../layout-manager/layoutManagerFactory";
import { type Dataset, type Neuron, NeuronsService } from "../rest";
import { GlobalError } from "./Error.ts";
import { type EnhancedNeuron, type NeuronGroup, type ViewerSynchronizationPair, ViewerType, Visibility } from "./models";
import { SynchronizerOrchestrator } from "./synchronizer";

function triggerUpdate<T extends Workspace>(_prototype: any, _key: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  // Special implementation for async methods
  if (originalMethod.constructor.name === "AsyncFunction") {
    descriptor.value = async function (this: T, ...args: any[]): Promise<any> {
      if (isDraft(this)) {
        return await originalMethod.apply(this, args);
      }
      const draft = createDraft(this);
      await originalMethod.apply(draft, args);
      const updated = finishDraft(draft) as T;
      this.updateContext(updated);
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  }

  // Implementation for normal-sync methods
  descriptor.value = function (this: T, ...args: any[]): any {
    if (isDraft(this)) {
      return originalMethod.apply(this, args);
    }
    const updated = produce(this, (draft: any) => {
      originalMethod.apply(draft, args);
    });
    this.updateContext(updated);
    return originalMethod.apply(this, args);
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
  neuronGroups: Record<string, NeuronGroup>;

  store: ReturnType<typeof configureStore>;
  layoutManager: LayoutManager;

  syncOrchestrator: SynchronizerOrchestrator;
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
    this.neuronGroups = {};

    const { layoutManager, store } = getLayoutManagerAndStore(id);
    this.layoutManager = layoutManager;
    this.syncOrchestrator = SynchronizerOrchestrator.create();

    this.store = store;
    this.updateContext = updateContext;

    this._initializeAvailableNeurons();
  }

  @triggerUpdate
  activateNeuron(neuron: Neuron): Workspace {
    this.activeNeurons.add(neuron.name);
    return this;
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
        draft.availableNeurons[neuronId].isVisible = false;
        draft.selectedNeurons.delete(neuronId);
        // todo: add actions for other viewers
        draft.availableNeurons[neuronId].viewerData[ViewerType.Graph].visibility = Visibility.Hidden;
      }
    });
    this.updateContext(updated);
  }

  @triggerUpdate
  showNeuron(neuronId: string): void {
    if (this.availableNeurons[neuronId]) {
      this.availableNeurons[neuronId].isVisible = true;
      // todo: add actions for other viewers
      this.availableNeurons[neuronId].viewerData[ViewerType.Graph].visibility = Visibility.Visible;
    }
  }

  @triggerUpdate
  async activateDataset(dataset: Dataset): Promise<void> {
    this.activeDatasets[dataset.id] = dataset;
    await this._getAvailableNeurons();
  }

  @triggerUpdate
  async deactivateDataset(datasetId: string): Promise<void> {
    delete this.activeDatasets[datasetId];
    await this._getAvailableNeurons();
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

  @triggerUpdate
  setActiveNeurons(newActiveNeurons: Set<string>): void {
    this.activeNeurons = newActiveNeurons;
  }

  @triggerUpdate
  clearSelectedNeurons(): void {
    this.selectedNeurons.clear();
  }

  @triggerUpdate
  updateViewerSynchronizationStatus(pair: ViewerSynchronizationPair, isActive: boolean): void {
    this.syncOrchestrator.setActive(pair, isActive);
  }

  @triggerUpdate
  switchViewerSynchronizationStatus(pair: ViewerSynchronizationPair): void {
    this.syncOrchestrator.switchSynchronizer(pair);
  }

  @triggerUpdate
  addNeuronToGroup(neuronId: string, groupId: string): void {
    if (!this.activeNeurons[neuronId]) {
      throw new Error("Neuron not found");
    }
    const group = this.neuronGroups[groupId];
    if (!group) {
      throw new Error("Neuron group not found");
    }
    group.neurons.add(neuronId);
  }

  @triggerUpdate
  createNeuronGroup(neuronGroup: NeuronGroup): void {
    this.neuronGroups[neuronGroup.id] = neuronGroup;
  }

  @triggerUpdate
  changeViewerVisibility(viewerId: ViewerType, isVisible: boolean): void {
    if (this.viewers[viewerId] === undefined) {
      throw new Error("Viewer not found");
    }
    this.viewers[viewerId] = isVisible;
  }

  async _initializeAvailableNeurons() {
    await this._getAvailableNeurons();
  }

  @triggerUpdate
  async _getAvailableNeurons(): Promise<void> {
    try {
      const datasetIds = Object.keys(this.activeDatasets);
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

      this.availableNeurons = {};
      for (const neuron of uniqueNeurons) {
        const previousNeuron = this.availableNeurons[neuron.name];

        const enhancedNeuron: EnhancedNeuron = {
          ...neuron,
          viewerData: {
            [ViewerType.Graph]: {
              defaultPosition: previousNeuron?.viewerData[ViewerType.Graph]?.defaultPosition || null,
              visibility:
                previousNeuron?.viewerData[ViewerType.Graph]?.visibility !== undefined
                  ? previousNeuron.viewerData[ViewerType.Graph].visibility
                  : this.activeNeurons.has(neuron.name)
                    ? Visibility.Visible
                    : Visibility.Unset,
            },
            [ViewerType.ThreeD]: previousNeuron?.viewerData[ViewerType.ThreeD] || {},
            [ViewerType.EM]: previousNeuron?.viewerData[ViewerType.EM] || {},
            [ViewerType.InstanceDetails]: previousNeuron?.viewerData[ViewerType.InstanceDetails] || {},
          },
          isVisible: previousNeuron?.isVisible ?? this.activeNeurons.has(neuron.name),
        };

        this.availableNeurons[neuron.name] = enhancedNeuron;
      }
    } catch (error) {
      throw new GlobalError(`Failed to fetch neurons: ${error}`);
    }
  }

  customUpdate(updateFunction: (draft: Workspace) => void): void {
    const updated = produce(this, updateFunction);
    this.updateContext(updated);
  }

  @triggerUpdate
  setSelection(selection: Array<string>, initiator: ViewerType) {
    const selectedNeurons = Object.values(this.availableNeurons).filter((neuron) => selection.includes(neuron.name));
    this.syncOrchestrator.select(selectedNeurons, initiator);
  }

  getHiddenNeurons() {
    const hiddenNodes = new Set<string>();

    for (const neuronId of this.activeNeurons) {
      const neuron = this.availableNeurons[neuronId];
      if (neuron && !neuron.isVisible) {
        hiddenNodes.add(neuronId);
      }
    }

    return hiddenNodes;
  }

  getNeuronCellsByClass(neuronClassId: string): string[] {
    return Object.values(this.availableNeurons)
      .filter((neuron) => neuron.nclass === neuronClassId && neuron.nclass !== neuron.name)
      .map((neuron) => neuron.name);
  }
}
