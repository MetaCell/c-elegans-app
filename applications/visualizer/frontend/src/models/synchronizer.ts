import { type EnhancedNeuron, ViewerSynchronizationPair, ViewerType } from "./models";

export type SynchronizerContext = Array<string>;
export type Selection = Array<EnhancedNeuron>;

const syncViewerDefs: Record<ViewerSynchronizationPair, [ViewerType, ViewerType]> = {
  [ViewerSynchronizationPair.Graph_InstanceDetails]: [ViewerType.Graph, ViewerType.InstanceDetails],
  [ViewerSynchronizationPair.Graph_ThreeD]: [ViewerType.Graph, ViewerType.ThreeD],
  [ViewerSynchronizationPair.ThreeD_EM]: [ViewerType.ThreeD, ViewerType.EM],
};

class Synchronizer {
  active: boolean;
  viewers: [ViewerType, ViewerType];
  readonly pair: ViewerSynchronizationPair;

  private constructor(active: boolean, pair: ViewerSynchronizationPair) {
    this.active = active;
    this.viewers = syncViewerDefs[pair];
    this.pair = pair;
  }

  public static create(active: boolean, pair: ViewerSynchronizationPair) {
    return new Synchronizer(active, pair);
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
  contexts: Record<ViewerType, SynchronizerContext>;
  synchronizers: Array<Synchronizer>;

  private constructor(synchronizers: Array<Synchronizer>, contexts?: Record<ViewerType, SynchronizerContext>) {
    this.synchronizers = synchronizers;
    if (contexts) {
      this.contexts = { ...contexts };
    } else {
      this.contexts = {
        [ViewerType.EM]: [],
        [ViewerType.Graph]: [],
        [ViewerType.InstanceDetails]: [],
        [ViewerType.ThreeD]: [],
      };
    }
  }

  public static create(activesSync?: Record<ViewerSynchronizationPair, boolean>, contexts?: Record<ViewerType, SynchronizerContext>) {
    const synchronizers = [
      Synchronizer.create(activesSync?.[ViewerSynchronizationPair.Graph_InstanceDetails] || true, ViewerSynchronizationPair.Graph_InstanceDetails),
      Synchronizer.create(activesSync?.[ViewerSynchronizationPair.Graph_ThreeD] || true, ViewerSynchronizationPair.Graph_ThreeD),
      Synchronizer.create(activesSync?.[ViewerSynchronizationPair.ThreeD_EM] || true, ViewerSynchronizationPair.ThreeD_EM),
    ];

    return new SynchronizerOrchestrator(synchronizers, contexts);
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
