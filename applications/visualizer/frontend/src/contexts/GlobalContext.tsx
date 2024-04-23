import React, {createContext, useState, useContext, ReactNode} from 'react';
import {Workspace} from "../models.ts";

export interface GlobalContextType {
    workspaces: Record<string, Workspace>;
    currentWorkspaceId: string | undefined;
    addWorkspace: (workspace: Workspace) => void;
    updateWorkspace: (workspaceId: string, workspace: Workspace) => void;
    removeWorkspace: (workspaceId: string) => void;
    switchWorkspace: (workspaceId: string) => void;
}

interface GlobalContextProviderProps {
    children: ReactNode;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalContextProvider: React.FC<GlobalContextProviderProps> = ({children}) => {
    const [workspaces, setWorkspaces] = useState<Record<string, Workspace>>({});
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | undefined>(undefined);

    const addWorkspace = (workspace: Workspace) => {
        setWorkspaces(prev => ({...prev, [workspace.id]: workspace}));
    };

    const updateWorkspace = (workspaceId: string, updatedWorkspace: Workspace) => {
        setWorkspaces(prev => ({
            ...prev,
            [workspaceId]: updatedWorkspace
        }));
    };

    const removeWorkspace = (workspaceId: string) => {
        const updatedWorkspaces = {...workspaces};
        delete updatedWorkspaces[workspaceId];
        setWorkspaces(updatedWorkspaces);
    };

    const switchWorkspace = (workspaceId: string) => {
        setCurrentWorkspaceId(workspaceId);
    };

    return (
        <GlobalContext.Provider
            value={{workspaces, currentWorkspaceId, addWorkspace, updateWorkspace, removeWorkspace, switchWorkspace}}>
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