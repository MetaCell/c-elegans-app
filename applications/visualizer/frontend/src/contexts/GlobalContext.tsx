import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { ViewMode } from "../models";
import { Workspace } from "../models";
import { Dataset, DatasetsService } from "../rest";
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
  datasets: Array<Dataset>;
  fetchDatasets: () => void;
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
  const [datasets, setDatasets] = useState<Array<Dataset>>([]);

  const createWorkspace = (id: string, name: string, activeDatasets: Set<string>, activeNeurons: Set<string>) => {
    const newWorkspace = new Workspace(id, name, activeDatasets, activeNeurons, updateWorkspace);
    setWorkspaces((prev) => ({ ...prev, [id]: newWorkspace }));
  };

  const updateWorkspace = (workspace: Workspace) => {
    setWorkspaces((prev) => ({
      ...prev,
      [workspace.id]: workspace,
    }));
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

  const fetchDatasets = async () => {
    try {
      const response = await DatasetsService.getDatasets({});
      setDatasets(response);
    } catch (error) {
      console.error("Failed to fetch datasets", error);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  return (
    <GlobalContext.Provider
      value={{
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
      }}
    >
      {children}
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
