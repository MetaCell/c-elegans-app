import type React from "react";
import { type ReactNode, createContext, useContext, useEffect, useState } from "react";
import ErrorAlert from "../components/ErrorAlert.tsx";
import ErrorBoundary from "../components/ErrorBoundary.tsx";
import { ViewMode } from "../models";
import { Workspace } from "../models";
import { GlobalError } from "../models/Error.ts";
import { type Dataset, DatasetsService } from "../rest";
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
  setSelectedWorkspacesIds: (workspaceId: Set<string>) => void;
  datasets: Record<string, Dataset>;
  fetchDatasets: () => void;
  setAllWorkspaces: (workspaces: Record<string, Workspace>) => void;
  handleErrors: (error: Error) => void;
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
  const createWorkspace = (id: string, name: string, activeDatasetKeys: Set<string>, activeNeurons: Set<string>) => {
    // Convert the activeDatasetKeys into a Record<string, Dataset>
    const activeDatasets: Record<string, Dataset> = {};

    activeDatasetKeys.forEach((key) => {
      if (datasets[key]) {
        activeDatasets[key] = datasets[key];
      }
    });

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
    return workspaces[currentWorkspaceId];
  };

  const handleErrors = (error: Error) => {
    if (error instanceof GlobalError) {
      setErrorMessage(error.message);
      setOpenErrorAlert(true);
    }
  };
  const getGlobalContext = () => ({
    workspaces,
    currentWorkspaceId,
    getCurrentWorkspace,
    createWorkspace,
    updateWorkspace,
    removeWorkspace,
    setCurrentWorkspace,
    viewMode,
    setViewMode,
    selectedWorkspacesIds,
    setSelectedWorkspacesIds,
    fetchDatasets,
    datasets,
    setAllWorkspaces,
    handleErrors,
  });
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

  useEffect(() => {
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
