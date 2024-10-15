import { immerable } from "immer";
import type { Neuron } from "../rest";
import { ViewerSynchronizationPair, ViewerType } from "./models";

export type SynchronizerContext = Array<string>;
export type Selection = Array<Neuron>;

const syncViewerDefs: Record<ViewerSynchronizationPair, [ViewerType, ViewerType]> = {
  [ViewerSynchronizationPair.Graph_InstanceDetails]: [ViewerType.Graph, ViewerType.InstanceDetails],
  [ViewerSynchronizationPair.Graph_ThreeD]: [ViewerType.Graph, ViewerType.ThreeD],
  [ViewerSynchronizationPair.ThreeD_EM]: [ViewerType.ThreeD, ViewerType.EM],
};

class Synchronizer {
  [immerable] = true;

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

  public canHandle(viewer: ViewerType) {
    return this.viewers.includes(viewer);
  }

  public firstViewer(): ViewerType {
    return this.viewers[0];
  }

  public secondViewer(): ViewerType {
    return this.viewers[1];
  }

  public otherViewer(viewer: ViewerType): ViewerType {
    if (this.viewers[0] === viewer) {
      return this.viewers[1];
    }
    return this.viewers[0];
  }

  sync(selection: Array<string>, initiator: ViewerType, contexts: Record<ViewerType, SynchronizerContext>): ViewerType {
    if (!this.active) {
      contexts[initiator] = [...selection];
      return;
    }

    for (const viewer of this.viewers) {
      contexts[viewer] = [...selection];
    }
  }

  select(selection: string, initiator: ViewerType, contexts: Record<ViewerType, SynchronizerContext>): ViewerType {
    if (!this.active) {
      contexts[initiator] = [...new Set([...contexts[initiator], selection])];
      return;
    }

    for (const viewer of this.viewers) {
      contexts[viewer] = [...new Set([...contexts[viewer], selection])];
    }
  }

  unSelect(selection: string, initiator: ViewerType, contexts: Record<ViewerType, SynchronizerContext>): ViewerType {
    if (!this.active) {
      const storedNodes = [...contexts[initiator]];
      contexts[initiator] = storedNodes.filter((n) => n !== selection);
      return;
    }

    for (const viewer of this.viewers) {
      const storedNodes = [...contexts[viewer]];
      contexts[viewer] = storedNodes.filter((n) => n !== selection);
    }
  }

  clear(initiator: ViewerType, contexts: Record<ViewerType, SynchronizerContext>) {
    if (!this.active) {
      contexts[initiator] = [];
      return;
    }

    for (const viewer of this.viewers) {
      contexts[viewer] = [];
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

  private getConnectedViewers(initiator: ViewerType): Set<Synchronizer> {
    const synchros = new Set<Synchronizer>();

    for (const synchronizer of this.synchronizers) {
      if (synchronizer.canHandle(initiator)) {
        synchros.add(synchronizer);
        const otherViewer = synchronizer.otherViewer(initiator);
        for (const connectedSynchronizer of this.synchronizers) {
          if (connectedSynchronizer === synchronizer) {
            continue;
          }
          if (connectedSynchronizer.canHandle(otherViewer)) {
            synchros.add(connectedSynchronizer);
          }
        }
      }
    }
    return synchros;
  }

  public select(selection: Array<string>, initiator: ViewerType) {
    const synchronizers = this.getConnectedViewers(initiator);
    for (const synchronizer of synchronizers) {
      synchronizer.sync(selection, initiator, this.contexts);
    }
  }

  public selectNeuron(selection: string, initiator: ViewerType) {
    const synchronizers = this.getConnectedViewers(initiator);
    for (const synchronizer of synchronizers) {
      synchronizer.select(selection, initiator, this.contexts);
    }
  }

  public unSelectNeuron(selection: string, initiator: ViewerType) {
    const synchronizers = this.getConnectedViewers(initiator);
    for (const synchronizer of synchronizers) {
      synchronizer.unSelect(selection, initiator, this.contexts);
    }
  }

  public clearSelection(initiator: ViewerType) {
    const synchronizers = this.getConnectedViewers(initiator);
    for (const synchronizer of synchronizers) {
      synchronizer.clear(initiator, this.contexts);
    }
  }

  public getSelection(viewerType: ViewerType): SynchronizerContext {
    return this.contexts[viewerType];
  }
  public setActive(synchronizer: ViewerSynchronizationPair, isActive: boolean) {
    const synchros = this.synchronizers[synchronizer];
    synchros.setActive(isActive);

    if (isActive) {
      // When we merge the selections
      const selection = new Set(
        this.synchronizers
          .filter((s) => s.canHandle(synchros.firstViewer()) || s.canHandle(synchros.secondViewer()))
          .flatMap((s) => [...this.getSelection(s.firstViewer()), ...this.getSelection(s.secondViewer())]),
      );

      this.select([...selection], synchros.firstViewer());
    }
  }

  public isActive(synchronizer: ViewerSynchronizationPair) {
    return this.synchronizers[synchronizer].active;
  }

  public switchSynchronizer(syncPair: ViewerSynchronizationPair) {
    const active = this.synchronizers[syncPair].active;
    this.setActive(syncPair, !active);
  }
}
