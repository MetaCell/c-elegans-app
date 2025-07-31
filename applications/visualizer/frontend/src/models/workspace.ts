import type { LayoutManager } from "@metacell/geppetto-meta-client/common/layout/LayoutManager";
import type { configureStore } from "@reduxjs/toolkit";
import { createDraft, finishDraft, immerable, isDraft, produce } from "immer";
import getLayoutManagerAndStore from "../layout-manager/layoutManagerFactory";
import { type Dataset, type GroupedSynapse, type Neuron, NeuronsService, SynapsesService } from "../rest";
import { GlobalError } from "./Error.ts";
import {
  type EMViewerSettings,
  type NeuronGroup,
  type ViewerData,
  type ViewerSynchronizationPair,
  ViewerType,
  Visibility,
  type VisibilityContainer,
  getDefaultViewerData,
} from "./models";
import { type SynchronizerContext, SynchronizerOrchestrator } from "./synchronizer";

function triggerUpdate<T extends Workspace>(_prototype: any, _key: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  // Special implementation for async methods
  if (originalMethod.constructor.name === "AsyncFunction") {
    descriptor.value = async function (this: T, ...args: any[]): Promise<any> {
      if (isDraft(this)) {
        return this;
      }
      const draft = createDraft(this);
      await originalMethod.apply(draft, args);
      const updated = finishDraft(draft) as T;
      this.updateContext(updated);
      return updated;
    };
    return descriptor;
  }
  // Implementation for normal-sync methods
  descriptor.value = function (this: T, ...args: any[]): any {
    if (isDraft(this)) {
      return this;
    }
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
  availableNeurons: Record<string, Neuron>;
  // neuronId
  activeNeurons: Set<string>;
  activeSynapses: Set<number>;
  visibilities: VisibilityContainer;
  viewers: Record<ViewerType, boolean>;
  neuronGroups: Record<string, NeuronGroup>;
  emViewerSettings: EMViewerSettings;
  synapsesData: GroupedSynapse | undefined;

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
    visibilities?: VisibilityContainer,
    neuronGroups?: Record<string, NeuronGroup>,
    emViewerSettings?: EMViewerSettings,
    viewers?: Record<ViewerType, boolean>,
    activeSynapses?: Set<number>,
  ) {
    this.id = id;
    this.name = name;
    this.activeDatasets = activeDatasets;
    this.availableNeurons = {};
    this.activeNeurons = activeNeurons || new Set();
    this.viewers = viewers || {
      [ViewerType.Graph]: true,
      [ViewerType.ThreeD]: false,
      [ViewerType.EM]: false,
    };
    this.neuronGroups = neuronGroups || {};
    this.synapsesData = undefined;
    // Set EM viewer settings
    if (!emViewerSettings) {
      const firstActiveDataset = Object.values(activeDatasets)?.[0];
      const [minSlice, maxSlice] = firstActiveDataset.emData.sliceRange;
      const startSlice = Math.floor((maxSlice + minSlice) / 2);
      this.emViewerSettings = {
        showNeurons: true,
        showSynapses: true,
        startSlice: startSlice,
      };
    } else {
      this.emViewerSettings = { ...emViewerSettings };
    }

    const { layoutManager, store } = getLayoutManagerAndStore(id);
    this.layoutManager = layoutManager;
    this.syncOrchestrator = SynchronizerOrchestrator.create(activeSynchronizers, contexts);

    this.visibilities = visibilities || {
      neurons: Object.fromEntries([...(activeNeurons || [])].map((n) => [n, getDefaultViewerData(Visibility.Visible)])),
      synapses: Object.fromEntries([...(activeSynapses || [])].map((s) => [s, getDefaultViewerData(Visibility.Visible)])),
    };

    this.store = store;
    this.updateContext = updateContext;

    this._initializeAvailableNeurons();
  }

  @triggerUpdate
  activateNeuron(neuron: Neuron) {
    this.activeNeurons.add(neuron.name);
    this.visibilities.neurons[neuron.name] = getDefaultViewerData();
    return this;
  }

  @triggerUpdate
  deactivateNeuron(neuronId: string) {
    this.activeNeurons.delete(neuronId);
    delete this.visibilities.neurons[neuronId];
    return this;
  }

  @triggerUpdate
  hideNeuron(neuronId: string) {
    if (!(neuronId in this.visibilities.neurons)) {
      this.visibilities[neuronId] = getDefaultViewerData(Visibility.Hidden);
      this.removeSelection(neuronId, ViewerType.Graph);
    }
    // todo: add actions for other viewers
    this.visibilities.neurons[neuronId][ViewerType.Graph].visibility = Visibility.Hidden;
    this.visibilities.neurons[neuronId][ViewerType.ThreeD].visibility = Visibility.Hidden;
    this.visibilities.neurons[neuronId][ViewerType.EM].visibility = Visibility.Hidden;
    return this;
  }

  @triggerUpdate
  showNeuron(neuronId: string) {
    if (!(neuronId in this.visibilities.neurons)) {
      this.visibilities.neurons[neuronId] = getDefaultViewerData(Visibility.Visible);
    }
    // todo: add actions for other viewers
    this.visibilities.neurons[neuronId][ViewerType.Graph].visibility = Visibility.Visible;
    this.visibilities.neurons[neuronId][ViewerType.ThreeD].visibility = Visibility.Visible;
    this.visibilities.neurons[neuronId][ViewerType.EM].visibility = Visibility.Visible;
    return this;
  }

  @triggerUpdate
  async activateDataset(dataset: Dataset) {
    this.activeDatasets[dataset.id] = dataset;
    await this._getAvailableNeurons();
    return this;
  }

  @triggerUpdate
  async deactivateDataset(datasetId: string) {
    delete this.activeDatasets[datasetId];

    await this._getAvailableNeurons();
    return this;
  }

  @triggerUpdate
  setActiveNeurons(newActiveNeurons: Set<string>) {
    this.activeNeurons = newActiveNeurons;
    return this;
  }

  @triggerUpdate
  updateViewerSynchronizationStatus(pair: ViewerSynchronizationPair, isActive: boolean) {
    this.syncOrchestrator.setActive(pair, isActive);
    return this;
  }

  @triggerUpdate
  switchViewerSynchronizationStatus(pair: ViewerSynchronizationPair) {
    this.syncOrchestrator.switchSynchronizer(pair);
    return this;
  }

  @triggerUpdate
  addNeuronToGroup(neuronId: string, groupId: string) {
    if (!this.activeNeurons[neuronId]) {
      throw new Error("Neuron not found");
    }
    const group = this.neuronGroups[groupId];
    if (!group) {
      throw new Error("Neuron group not found");
    }
    group.neurons.add(neuronId);
    return this;
  }

  @triggerUpdate
  createNeuronGroup(neuronGroup: NeuronGroup): this {
    this.neuronGroups[neuronGroup.id] = neuronGroup;
    return this;
  }

  @triggerUpdate
  changeViewerVisibility(viewerId: ViewerType, isVisible: boolean): this {
    if (this.viewers[viewerId] === undefined) {
      throw new Error("Viewer not found");
    }
    this.viewers[viewerId] = isVisible;
    return this;
  }

  async _initializeAvailableNeurons() {
    await this._getAvailableNeurons();
  }

  async _getAvailableNeurons() {
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
          const neuronClass = {
            ...neuron,
            name: className,
            model3DUrls: [...neuron.model3DUrls],
            datasetIds: [...neuron.datasetIds],
          };
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
  locallyInjectSelection(selection: string, target: ViewerType) {
    this.syncOrchestrator.locallyInjectSelection(selection, target);
    return this;
  }

  @triggerUpdate
  locallyRemoveSelection(selection: string, target: ViewerType) {
    this.syncOrchestrator.locallyRemoveSelection(selection, target);
    return this;
  }

  @triggerUpdate
  setSelection(selection: Array<string>, initiator: ViewerType) {
    this.syncOrchestrator.select(selection, initiator);
    return this;
  }

  @triggerUpdate
  clearSelection(initiator: ViewerType): Workspace {
    this.syncOrchestrator.clearSelection(initiator);
    return this;
  }

  @triggerUpdate
  addSelection(selection: string, initiator: ViewerType) {
    this.syncOrchestrator.selectNeuron(selection, initiator);
    return this;
  }

  @triggerUpdate
  removeSelection(selection: string, initiator: ViewerType) {
    this.syncOrchestrator.unSelectNeuron(selection, initiator);
    return this;
  }

  getSelection(viewerType: ViewerType): string[] {
    return this.syncOrchestrator.getSelection(viewerType);
  }

  getNeuronCellsByClass(neuronClassId: string): string[] {
    return Object.values(this.availableNeurons)
      .filter((neuron) => neuron.nclass === neuronClassId && neuron.nclass !== neuron.name)
      .map((neuron) => neuron.name);
  }

  getNeuronClass(neuronId: string): string {
    const neuron = this.availableNeurons[neuronId];
    return neuron?.nclass;
  }

  getVisibleNeuronsInThreeD(): string[] {
    return Array.from(this.activeNeurons).filter((neuronId) => this.visibilities.neurons[neuronId]?.[ViewerType.ThreeD]?.visibility === Visibility.Visible);
  }

  getVisibleNeuronsInEM(): string[] {
    return Array.from(this.activeNeurons).filter((neuronId) => this.visibilities.neurons[neuronId]?.[ViewerType.EM]?.visibility === Visibility.Visible);
  }

  getNeuronVisibility(neuronId: string): ViewerData {
    return this.visibilities.neurons[neuronId];
  }

  getSynapseVisibility(synapseId: number): ViewerData {
    return this.visibilities.synapses[synapseId];
  }

  @triggerUpdate
  showSynapse(synapseId: number) {
    if (!(synapseId in this.visibilities.synapses)) {
      this.visibilities.synapses[synapseId] = getDefaultViewerData(Visibility.Visible);
    }
    // Set visibility for all viewers
    this.visibilities.synapses[synapseId][ViewerType.Graph].visibility = Visibility.Visible;
    this.visibilities.synapses[synapseId][ViewerType.ThreeD].visibility = Visibility.Visible;
    this.visibilities.synapses[synapseId][ViewerType.EM].visibility = Visibility.Visible;
    return this;
  }

  @triggerUpdate
  hideSynapse(synapseId: number) {
    if (!(synapseId in this.visibilities.synapses)) {
      this.visibilities.synapses[synapseId] = getDefaultViewerData(Visibility.Hidden);
    }
    // Set visibility for all viewers
    this.visibilities.synapses[synapseId][ViewerType.Graph].visibility = Visibility.Hidden;
    this.visibilities.synapses[synapseId][ViewerType.ThreeD].visibility = Visibility.Hidden;
    this.visibilities.synapses[synapseId][ViewerType.EM].visibility = Visibility.Hidden;
    return this;
  }

  // Helper methods for use within customUpdate (no @triggerUpdate decorator)
  _showSynapseInternal(synapseId: number) {
    if (!(synapseId in this.visibilities.synapses)) {
      this.visibilities.synapses[synapseId] = getDefaultViewerData(Visibility.Visible);
    }
    // Set visibility for all viewers
    this.visibilities.synapses[synapseId][ViewerType.Graph].visibility = Visibility.Visible;
    this.visibilities.synapses[synapseId][ViewerType.ThreeD].visibility = Visibility.Visible;
    this.visibilities.synapses[synapseId][ViewerType.EM].visibility = Visibility.Visible;
  }

  _hideSynapseInternal(synapseId: number) {
    if (!(synapseId in this.visibilities.synapses)) {
      this.visibilities.synapses[synapseId] = getDefaultViewerData(Visibility.Hidden);
    }
    // Set visibility for all viewers
    this.visibilities.synapses[synapseId][ViewerType.Graph].visibility = Visibility.Hidden;
    this.visibilities.synapses[synapseId][ViewerType.ThreeD].visibility = Visibility.Hidden;
    this.visibilities.synapses[synapseId][ViewerType.EM].visibility = Visibility.Hidden;
  }

  changeNeuronColorForViewers(neuronId: string, color: string): void {
    const viewers: ViewerType[] = [ViewerType.ThreeD, ViewerType.EM];

    const updated = produce(this, (draft: Workspace) => {
      for (const viewerType of viewers) {
        if (viewerType in draft.visibilities.neurons[neuronId]) {
          const viewerData = draft.visibilities.neurons[neuronId]?.[viewerType];
          if (viewerData && "color" in viewerData && typeof viewerData.color === "string") {
            viewerData.color = color;
          }
        }
      }
    });

    this.updateContext(updated);
  }

  // Those methods do not trigger updates as they are only here to store settings for the share function
  // We don't want to trigger re-renderings of the full app
  setEmviewerSlice(slice: number) {
    this.emViewerSettings.startSlice = slice;
  }

  emViewerShowNeurons(show: boolean) {
    this.emViewerSettings.showNeurons = show;
  }

  emViewerShowSynapses(show: boolean) {
    this.emViewerSettings.showSynapses = show;
  }

  @triggerUpdate
  async fetchSynapses() {
    const visibleNeurons = Array.from(this.activeNeurons).filter((id) =>
      Object.values(this.visibilities.neurons[id]).every((e) => e === undefined || e.visibility === Visibility.Visible),
    );

    try {
      const synapses = await SynapsesService.getDatasetSynapses({
        datasetIds: Object.keys(this.activeDatasets),
        neurons: visibleNeurons,
      });
      this.synapsesData = synapses;

      // Extract synapse IDs from the fetched data and populate activeSynapses
      const synapseIds = new Set<number>();
      if (synapses && synapses.synapses) {
        for (const [_, prePostEntry] of Object.entries(synapses.synapses)) {
          // Extract synapse IDs from pre connections
          for (const [_, postEntries] of Object.entries(prePostEntry.pre)) {
            for (const [_, synapseEntries] of Object.entries(postEntries)) {
              for (const synapseEntry of synapseEntries) {
                synapseIds.add(synapseEntry.id);
              }
            }
          }
          // Extract synapse IDs from post connections
          for (const [_, postEntries] of Object.entries(prePostEntry.post)) {
            for (const [_, synapseEntries] of Object.entries(postEntries)) {
              for (const synapseEntry of synapseEntries) {
                synapseIds.add(synapseEntry.id);
              }
            }
          }
        }
      }

      // Update activeSynapses and initialize visibilities for new synapses
      this.activeSynapses = synapseIds;
      for (const synapseId of synapseIds) {
        if (!(synapseId in this.visibilities.synapses)) {
          this.visibilities.synapses[synapseId] = getDefaultViewerData(Visibility.Visible);
        }
      }
    } catch (error) {
      throw new GlobalError("Failed to fetch synapses");
    }

    return this;
  }

  getSynapsesData(): GroupedSynapse | undefined {
    return this.synapsesData;
  }
}
