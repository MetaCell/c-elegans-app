import React, { createContext, ReactNode, useContext, useState } from 'react';
import { ViewMode } from "../models/models.ts";
import { Workspace } from "../models/workspace.ts";

export interface GlobalContextType {
    workspaces: Record<string, Workspace>;
    currentWorkspaceId: string | undefined;
    viewMode: ViewMode;
    selectedWorkspacesIds: Set<string>;
    setViewMode: (viewMode: ViewMode) => void;
    addWorkspace: (id: string, name: string) => void;
    updateWorkspace: (workspace: Workspace) => void;
    removeWorkspace: (workspaceId: string) => void;
    setCurrentWorkspace: (workspaceId: string) => void;
    setSelectedWorkspacesIds: (workspaceId: Set<string>) => void;
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


    const addWorkspace = (id: string, name: string) => {
        const newWorkspace = new Workspace(id, name, updateWorkspace);
        setWorkspaces(prev => ({ ...prev, [id]: newWorkspace }));
    };

    const updateWorkspace = (workspace: Workspace) => {
        setWorkspaces(prev => ({
            ...prev,
            [workspace.id]: workspace
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


    return (
        <GlobalContext.Provider
            value={{
                workspaces,
                currentWorkspaceId,
                addWorkspace,
                updateWorkspace,
                removeWorkspace,
                setCurrentWorkspace,
                viewMode,
                setViewMode,
                selectedWorkspacesIds,
                setSelectedWorkspacesIds,
            }}>
            {children}
        </GlobalContext.Provider>
    );
};


export const useGlobalContext = () => {
    const context = useContext(GlobalContext);
    if (context === undefined) {
        throw new Error('useGlobalContext must be used within a GlobalContextProvider');
    }
    return context;
};