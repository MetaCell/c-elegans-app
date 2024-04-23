import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import {Dataset, Neuron, ViewMode, Workspace} from "../models.ts";
import {DatasetsService, NeuronsService} from "../rest";
import {mapDatasetFromRequestToContext, mapNeuronFromRequestToContext} from "../helpers/mappers.ts";

export interface GlobalContextType {
    workspaces: Record<string, Workspace>;
    neurons: Record<string, Neuron>;
    datasets: Record<string, Dataset>;
    currentWorkspaceId: string | undefined;
    addWorkspace: (workspace: Workspace) => void;
    updateWorkspace: (workspaceId: string, workspace: Workspace) => void;
    removeWorkspace: (workspaceId: string) => void;
    switchWorkspace: (workspaceId: string) => void;

    viewMode: ViewMode;
}

interface GlobalContextProviderProps {
    children: ReactNode;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalContextProvider: React.FC<GlobalContextProviderProps> = ({children}) => {
    const [workspaces, setWorkspaces] = useState<Record<string, Workspace>>({});
    const [neurons, setNeurons] = useState<Record<string, Neuron>>({});
    const [datasets, setDatasets] = useState<Record<string, Dataset>>({});
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | undefined>(undefined);
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Default);
    const [selectedWorkspacesIds, setSelectedWorkspacesIds] = useState<Set<string>>(new Set<string>());


    useEffect(() => {
        // Fetching Neurons
        // FIXME: Get All Cells without pagination
        NeuronsService.getAllCells({page: 1}).then(response => {
            const neuronMap = response.items.reduce((acc, neuronRequest) => {
                const neuron = mapNeuronFromRequestToContext(neuronRequest);
                return {...acc, [neuron.id]: neuron};
            }, {});
            setNeurons(neuronMap);
        }).catch(error => {
            console.error('Failed to fetch neurons:', error);
        });

        // Fetching Datasets
        DatasetsService.getAllDatasets().then(response => {
            const datasetMap = response.reduce((acc, datasetRequest) => {
                const dataset = mapDatasetFromRequestToContext(datasetRequest);
                return {...acc, [dataset.id]: dataset};
            }, {});
            setDatasets(datasetMap);
        }).catch(error => {
            console.error('Failed to fetch datasets:', error);
        });
    }, []);

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
            value={{
                workspaces,
                neurons,
                datasets,
                currentWorkspaceId,
                addWorkspace,
                updateWorkspace,
                removeWorkspace,
                switchWorkspace,
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