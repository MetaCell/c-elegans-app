import { immerable } from "immer";
import { type EnhancedNeuron, ViewerSynchronizationPair, ViewerType } from "./models";

type SynchronizerContext = Array<string>;
export type Selection = Array<EnhancedNeuron>;

const syncViewerDefs: Record<ViewerSynchronizationPair, [ViewerType, ViewerType]> = {
  [ViewerSynchronizationPair.Graph_InstanceDetails]: [ViewerType.Graph, ViewerType.InstanceDetails],
  [ViewerSynchronizationPair.Graph_ThreeD]: [ViewerType.Graph, ViewerType.ThreeD],
  [ViewerSynchronizationPair.ThreeD_EM]: [ViewerType.ThreeD, ViewerType.EM],
};

class Synchronizer {
  [immerable] = true;

  active: boolean;
  viewers: [ViewerType, ViewerType];

  private constructor(active: boolean, viewers: [ViewerType, ViewerType]) {
    this.active = active;
    this.viewers = viewers;
  }

  public static create(active: boolean, pair: ViewerSynchronizationPair) {
    return new Synchronizer(active, syncViewerDefs[pair]);
  }

  private canHandle(viewer: ViewerType) {
    return this.viewers.includes(viewer);
  }

  sync(selection: Selection, initiator: ViewerType, contexts: Record<ViewerType, SynchronizerContext>) {
    if (!this.canHandle(initiator)) {
      return;
    }

    if (!this.active) {
      contexts[initiator] = selection.map((n) => n.name);
      return;
    }

    for (const viewer of this.viewers) {
      contexts[viewer] = selection.map((n) => n.name);
    }
  }

  setActive(isActive: boolean) {
    this.active = isActive;
  }
}

export class SynchronizerOrchestrator {
  [immerable] = true;

  contexts: Record<ViewerType, SynchronizerContext>;
  synchronizers: Array<Synchronizer>;

  private constructor(synchronizers: Array<Synchronizer>) {
    this.synchronizers = synchronizers;
    this.contexts = {
      [ViewerType.EM]: [],
      [ViewerType.Graph]: [],
      [ViewerType.InstanceDetails]: [],
      [ViewerType.ThreeD]: [],
    };
  }

  public static create() {
    const synchronizers = [
      Synchronizer.create(true, ViewerSynchronizationPair.Graph_InstanceDetails),
      Synchronizer.create(true, ViewerSynchronizationPair.Graph_ThreeD),
      Synchronizer.create(true, ViewerSynchronizationPair.ThreeD_EM),
    ];

    return new SynchronizerOrchestrator(synchronizers);
  }

  public select(selection: Selection, initiator: ViewerType) {
    for (const synchronizer of this.synchronizers) {
      synchronizer.sync(selection, initiator, this.contexts);
    }
  }

  public setActive(synchronizer: ViewerSynchronizationPair, isActive: boolean) {
    this.synchronizers[synchronizer].setActive(isActive);
  }

  public isActive(synchronizer: ViewerSynchronizationPair) {
    return this.synchronizers[synchronizer].active;
  }

  public switchSynchronizer(syncPair: ViewerSynchronizationPair) {
    const synchronizer = this.synchronizers[syncPair];
    synchronizer.setActive(!synchronizer.active);
  }
}
