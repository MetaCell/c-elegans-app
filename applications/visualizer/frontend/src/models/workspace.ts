import type { LayoutManager } from "@metacell/geppetto-meta-client/common/layout/LayoutManager";
import type { configureStore } from "@reduxjs/toolkit";
import { createDraft, finishDraft, immerable, isDraft, produce } from "immer";
import getLayoutManagerAndStore from "../layout-manager/layoutManagerFactory";
import { type Dataset, type Neuron, NeuronsService } from "../rest";
import { GlobalError } from "./Error.ts";
import { type NeuronGroup, type ViewerData, type ViewerSynchronizationPair, ViewerType, Visibility, getDefaultViewerData } from "./models";
import { type SynchronizerContext, SynchronizerOrchestrator } from "./synchronizer";

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
  availableNeurons: Record<string, Neuron>;
  // neuronId
  activeNeurons: Set<string>;
  visibilities: Record<string, ViewerData>;
  viewers: Record<ViewerType, boolean>;
  neuronGroups: Record<string, NeuronGroup>;

  store: ReturnType<typeof configureStore>;
  layoutManager: LayoutManager;

  syncOrchestrator: SynchronizerOrchestrator;
  updateContext: (workspace: Workspace) => void;

  constructor(
    id: string,
    name: string,
    activeDatasets: Record<string, Dataset>,
    activeNeurons: Set<string>,
    updateContext: (workspace: Workspace) => void,
    activeSynchronizers?: Record<ViewerSynchronizationPair, boolean>,
    contexts?: Record<ViewerType, SynchronizerContext>,
    visibilities?: Record<string, ViewerData>,
  ) {
    this.id = id;
    this.name = name;
    this.activeDatasets = activeDatasets;
    this.availableNeurons = {};
    this.activeNeurons = activeNeurons || new Set();
    this.viewers = {
      [ViewerType.Graph]: true,
      [ViewerType.ThreeD]: false,
      [ViewerType.EM]: false,
      [ViewerType.InstanceDetails]: false,
    };
    this.neuronGroups = {};

    const { layoutManager, store } = getLayoutManagerAndStore(id);
    this.layoutManager = layoutManager;
    this.syncOrchestrator = SynchronizerOrchestrator.create(activeSynchronizers, contexts);

    this.visibilities = visibilities || Object.fromEntries([...activeNeurons].map((n) => [n, getDefaultViewerData(Visibility.Visible)]));

    this.store = store;
    this.updateContext = updateContext;

    this._initializeAvailableNeurons();
  }

  @triggerUpdate
  activateNeuron(neuron: Neuron): Workspace {
    this.activeNeurons.add(neuron.name);
    this.visibilities[neuron.name] = getDefaultViewerData();
    return this;
  }

  @triggerUpdate
  deactivateNeuron(neuronId: string): void {
    this.activeNeurons.delete(neuronId);
    delete this.visibilities[neuronId];
  }

  @triggerUpdate
  hideNeuron(neuronId: string): void {
    if (!(neuronId in this.visibilities)) {
      this.visibilities[neuronId] = getDefaultViewerData(Visibility.Hidden);
      this.removeSelection(neuronId, ViewerType.Graph);
    }
    // todo: add actions for other viewers
    this.visibilities[neuronId][ViewerType.Graph].visibility = Visibility.Hidden;
    this.visibilities[neuronId][ViewerType.ThreeD].visibility = Visibility.Hidden;
  }

  @triggerUpdate
  showNeuron(neuronId: string): void {
    if (!(neuronId in this.visibilities)) {
      this.visibilities[neuronId] = getDefaultViewerData(Visibility.Visible);
    }
    // todo: add actions for other viewers
    this.visibilities[neuronId][ViewerType.Graph].visibility = Visibility.Visible;
    this.visibilities[neuronId][ViewerType.ThreeD].visibility = Visibility.Visible;
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

  @triggerUpdate
  setActiveNeurons(newActiveNeurons: Set<string>): void {
    this.activeNeurons = newActiveNeurons;
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
          const neuronClass = { ...neuron, name: className, model3DUrls: [...neuron.model3DUrls], datasetIds: [...neuron.datasetIds] };
          neuronsClass[className] = neuronClass;
          uniqueNeurons.add(neuronClass);
        } else {
          neuronsClass[className].model3DUrls.push(...neuron.model3DUrls);
        }
      }

      this.availableNeurons = Object.fromEntries([...uniqueNeurons].map((n) => [n.name, n]));
    } catch (error) {
      throw new GlobalError("Failed to fetch neurons:");
    }
  }

  customUpdate(updateFunction: (draft: Workspace) => void): void {
    const updated = produce(this, updateFunction);
    this.updateContext(updated);
  }

  @triggerUpdate
  setSelection(selection: Array<string>, initiator: ViewerType) {
    this.syncOrchestrator.select(selection, initiator);
  }

  @triggerUpdate
  clearSelection(initiator: ViewerType): Workspace {
    this.syncOrchestrator.clearSelection(initiator);
    return this;
  }

  @triggerUpdate
  addSelection(selection: string, initiator: ViewerType) {
    this.syncOrchestrator.selectNeuron(selection, initiator);
  }

  @triggerUpdate
  removeSelection(selection: string, initiator: ViewerType) {
    this.syncOrchestrator.unSelectNeuron(selection, initiator);
  }

  getSelection(viewerType: ViewerType): string[] {
    return this.syncOrchestrator.getSelection(viewerType);
  }

  getViewerSelecedNeurons(viewerType: ViewerType): string[] {
    return this.syncOrchestrator.getSelection(viewerType);
  }

  getNeuronCellsByClass(neuronClassId: string): string[] {
    return Object.values(this.availableNeurons)
      .filter((neuron) => neuron.nclass === neuronClassId && neuron.nclass !== neuron.name)
      .map((neuron) => neuron.name);
  }

  getNeuronClass(neuronId: string): string {
    const neuron = this.availableNeurons[neuronId];
    return neuron.nclass;
  }

  getVisibleNeuronsInThreeD(): string[] {
    return Array.from(this.activeNeurons).filter((neuronId) => this.visibilities[neuronId]?.[ViewerType.ThreeD]?.visibility === Visibility.Visible);
  }

  changeNeuronColorForViewers(neuronId: string, color: string): void {
    const viewers: ViewerType[] = [ViewerType.ThreeD, ViewerType.EM];

    const updated = produce(this, (draft: Workspace) => {
      viewers.forEach((viewerType) => {
        if (viewerType in draft.visibilities[neuronId]) {
          draft.visibilities[neuronId][viewerType].color = color;
        }
      });
    });

    this.updateContext(updated);
  }
}
