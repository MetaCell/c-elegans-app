import type { NeuronGroup, ViewMode, ViewerType } from "../models";
import type { ViewerData, ViewerSynchronizationPair } from "../models/models";
import type { SynchronizerContext } from "../models/synchronizer";

type SerializedWorkspace = {
  id: string;
  name: string;
  activeNeurons: Array<string>;
  selectedNeurons: Array<string>;
  activeDatasets: Array<string>;
  viewers: Record<ViewerType, boolean>;
  neuronGroups: Record<string, NeuronGroup>;
  contexts: Record<ViewerType, SynchronizerContext>;
  activeSyncs: Record<ViewerSynchronizationPair, boolean>;
  visibilities: Record<string, ViewerData>;
};

export type SerializedGlobalContext = {
  workspaces: Record<string, SerializedWorkspace>;
  currentWorkspaceId: string;
  viewMode: ViewMode;
  selectedWorkspacesIds: Array<string>;
};
