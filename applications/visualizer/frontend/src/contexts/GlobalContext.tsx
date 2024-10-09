import { produce } from "immer";
import pako from "pako";
import type React from "react";
import { type ReactNode, createContext, useContext, useEffect, useState } from "react";
import ErrorAlert from "../components/ErrorAlert.tsx";
import ErrorBoundary from "../components/ErrorBoundary.tsx";
import { ViewMode } from "../models";
import { Workspace } from "../models";
import { GlobalError } from "../models/Error.ts";
import { type Dataset, DatasetsService } from "../rest";
import type { SerializedGlobalContext } from "./SerializedContext.tsx";

function b64Tob64Url(buffer: string): string {
  return buffer.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64UrlTo64(value: string): string {
  const m = value.length % 4;
  return value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(value.length + (m === 0 ? 0 : 4 - m), "=");
}

export interface GlobalContextType {
  workspaces: Record<string, Workspace>;
  currentWorkspaceId: string | undefined;
  viewMode: ViewMode;
  selectedWorkspacesIds: Set<string>;
  setViewMode: (viewMode: ViewMode) => void;
  createWorkspace: (id: string, name: string, activeDatasets?: Set<string>, activeNeurons?: Set<string>) => void;
  updateWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (workspaceId: string) => void;
  setCurrentWorkspace: (workspaceId: string) => void;
  getCurrentWorkspace: () => Workspace;
  getWorkspaceById: (workspaceId: string) => Workspace;
  setSelectedWorkspacesIds: (workspaceId: Set<string>) => void;
  datasets: Record<string, Dataset>;
  setAllWorkspaces: (workspaces: Record<string, Workspace>) => void;
  handleErrors: (error: Error) => void;
  serializeGlobalContext: () => string;
  restoreGlobalContext: (context: SerializedGlobalContext) => void;
  restoreGlobalContextFromBase64: (base64Context: string) => void;
  isGlobalRotating: boolean;
  toggleGlobalRotation: () => void;
}

interface GlobalContextProviderProps {
  children: ReactNode;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalContextProvider: React.FC<GlobalContextProviderProps> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Record<string, Workspace>>({});
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Default);
  const [selectedWorkspacesIds, setSelectedWorkspacesIds] = useState<Set<string>>(new Set<string>());
  const [datasets, setDatasets] = useState<Record<string, Dataset>>({});
  const [openErrorAlert, setOpenErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isGlobalRotating, setIsGlobalRotating] = useState(false);

  const createWorkspace = (id: string, name: string, activeDatasetKeys: Set<string>, activeNeurons: Set<string>) => {
    // Convert the activeDatasetKeys into a Record<string, Dataset>
    const activeDatasets: Record<string, Dataset> = {};

    for (const key of activeDatasetKeys) {
      if (datasets[key]) {
        activeDatasets[key] = datasets[key];
      }
    }

    // Create a new workspace using the activeDatasets record
    const newWorkspace = new Workspace(id, name, activeDatasets, activeNeurons, updateWorkspace);
    setWorkspaces((prev) => ({ ...prev, [id]: newWorkspace }));
  };

  const updateWorkspace = (workspace: Workspace) => {
    setWorkspaces({ ...workspaces, [workspace.id]: workspace });
  };

  const setAllWorkspaces = (workspaces: Record<string, Workspace>) => {
    // New function implementation
    setWorkspaces(workspaces);
  };
  const removeWorkspace = (workspaceId: string) => {
    const updatedWorkspaces = { ...workspaces };
    delete updatedWorkspaces[workspaceId];
    setWorkspaces(updatedWorkspaces);
  };

  const setCurrentWorkspace = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
  };

  const getCurrentWorkspace = () => {
    return workspaces?.[currentWorkspaceId];
  };

  const getWorkspaceById = (workspaceId: string) => {
    return workspaces?.[workspaceId];
  };

  const handleErrors = (error: Error) => {
    if (error instanceof GlobalError) {
      setErrorMessage(error.message);
      setOpenErrorAlert(true);
    }
  };

  const serializeGlobalContext = () => {
    // Create a special context with only the information we need
    const subContext = {
      workspaces: {},
      currentWorkspaceId,
      viewMode,
      selectedWorkspacesIds: [...selectedWorkspacesIds],
    };

    // Modify this context to remove the elements we don't want by workspace and to simplify it
    //   - layoutManager (not serializable)
    //   - store (related to the layour manager)
    //   - availableNeurons (they are computed when a workspace is created)
    //   - activeDatasets, we replace only with the keys of the datasets
    //   - synchronizerOrchestrator, we move some of its properties to the simplified workspace (gain space)
    //   - contexts comes from the synchronizer orchestrator
    //   - active viewers comes from the synchronizer orchestrator
    const updatedSubContext = produce(subContext, (draft) => {
      const simpleWorkspace = {};
      for (const [key, workspace] of Object.entries(workspaces)) {
        const copy = {
          ...workspace,
          layoutManager: undefined,
          store: undefined,
          availableNeurons: undefined,
          syncOrchestrator: undefined,
          activeDatasets: Object.keys(workspace.activeDatasets),
          contexts: workspace.syncOrchestrator.contexts,
          activeSyncs: Object.fromEntries(workspace.syncOrchestrator.synchronizers.map((sync) => [sync.pair, sync.active])),
        };
        simpleWorkspace[key] = copy;
      }
      draft.workspaces = simpleWorkspace;
    });

    const jsonContext = JSON.stringify(updatedSubContext, (_key, value) => (value instanceof Set ? [...value] : value));
    const gzipContext = pako.gzip(jsonContext);
    const base64UrlFragment = btoa(String.fromCharCode.apply(null, gzipContext));
    return b64Tob64Url(base64UrlFragment);
  };

  const restoreGlobalContext = (context: SerializedGlobalContext) => {
    setCurrentWorkspaceId(context.currentWorkspaceId);
    setSelectedWorkspacesIds(new Set(context.selectedWorkspacesIds));
    setViewMode(context.viewMode);

    const reconstructedWorkspaces = {};
    for (const [wsId, ws] of Object.entries(context.workspaces)) {
      const activeDatasets: Record<string, Dataset> = {};
      for (const key of ws.activeDatasets) {
        if (datasets[key]) {
          activeDatasets[key] = datasets[key];
        }
      }
      const workspace = new Workspace(ws.id, ws.name, activeDatasets, new Set(ws.activeNeurons), updateWorkspace, ws.activeSyncs, ws.contexts, ws.visibilities);
      workspace.viewers = ws.viewers;

      reconstructedWorkspaces[wsId] = workspace;
    }
    setWorkspaces(reconstructedWorkspaces);
  };

  const restoreGlobalContextFromBase64 = (base64UrlContext: string) => {
    const base64Context = b64UrlTo64(base64UrlContext);
    const gzipedContext = Uint8Array.from(atob(base64Context), (c) => c.charCodeAt(0));
    const serializedContext = pako.ungzip(gzipedContext);
    const jsonContext = new TextDecoder().decode(serializedContext);

    const ctx = JSON.parse(jsonContext) as SerializedGlobalContext;
    restoreGlobalContext(ctx);
  };

  const toggleGlobalRotation = () => {
    setIsGlobalRotating((prev) => !prev);
  };

  const getGlobalContext = () => ({
    workspaces,
    currentWorkspaceId,
    getCurrentWorkspace,
    getWorkspaceById,
    createWorkspace,
    updateWorkspace,
    removeWorkspace,
    setCurrentWorkspace,
    viewMode,
    setViewMode,
    selectedWorkspacesIds,
    setSelectedWorkspacesIds,
    datasets,
    setAllWorkspaces,
    handleErrors,
    serializeGlobalContext,
    restoreGlobalContext,
    restoreGlobalContextFromBase64,
    toggleGlobalRotation,
    isGlobalRotating,
  });

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await DatasetsService.getDatasets({});
        const datasetsRecord = response.reduce(
          (acc, dataset) => {
            acc[dataset.id] = dataset;
            return acc;
          },
          {} as Record<string, Dataset>,
        );

        setDatasets(datasetsRecord);
      } catch (error) {
        setOpenErrorAlert(true);
        setErrorMessage("Failed to fetch datasets");
      }
    };
    fetchDatasets();
  }, []);

  return (
    <GlobalContext.Provider value={getGlobalContext()}>
      <ErrorBoundary onError={handleErrors}>
        {children}
        <ErrorAlert open={openErrorAlert} setOpen={setOpenErrorAlert} errorMessage={errorMessage} />
      </ErrorBoundary>
    </GlobalContext.Provider>
  );
};
export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error("useGlobalContext must be used within a GlobalContextProvider");
  }
  return context;
};
