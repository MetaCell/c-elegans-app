import * as msgpack from "msgpack-lite";
import pako from "pako";
import type React from "react";
import { type ReactNode, createContext, useContext, useEffect, useState } from "react";
import * as YAML from "yaml";
import { ViewMode } from "../models";
import { Workspace } from "../models";
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
  setAllWorkspaces: (workspaces: Record<string, Workspace>) => void;
  updateContextFromJSON: (jsonContext: string) => void;
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

  const createWorkspace = (id: string, name: string, activeDatasetKeys: Set<string>, activeNeurons: Set<string>) => {
    // Convert the activeDatasetKeys into a Record<string, Dataset>
    const activeDatasets: Record<string, Dataset> = {};

    for (const key of activeDatasetKeys) {
      if (datasets[key]) {
        activeDatasetKeys[key] = datasets[key];
      }
    }

    // Create a new workspace using the activeDatasets record
    const newWorkspace = new Workspace(id, name, activeDatasets, activeNeurons, updateWorkspace);
    setWorkspaces((prev) => ({ ...prev, [id]: newWorkspace }));
  };

  const updateWorkspace = (workspace: Workspace) => {
    setWorkspaces((prev) => ({
      ...prev,
      [workspace.id]: workspace,
    }));
  };

  const setAllWorkspaces = (workspaces: Record<string, Workspace>) => {
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
        console.error("Failed to fetch datasets", error);
      }
    };

    fetchDatasets();
  }, []);

  const updateContextFromJSON = (jsonContext) => {
    const customDeserializer = {
      currentWorkspaceId: (value) => setCurrentWorkspaceId(value),
      viewMode: (value) => setViewMode(value),
      selectedWorkspacesIds: (value) => setSelectedWorkspacesIds(value),
    };

    // biome-ignore lint/suspicious/noExplicitAny: This signature is coming from JSON.parse(..., reviver)
    function reviver(this: any, key: string, value: any) {
      if (key.startsWith("workspace-")) {
        createWorkspace(value.id, value.name, new Set(value.activeDatasets), new Set(value.activeNeurons));
        return;
      }
      return customDeserializer[key]?.(value) || value;
    }

    JSON.parse(jsonContext, reviver);
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
    datasets,
    setAllWorkspaces,
    updateContextFromJSON,
  });

  return <GlobalContext.Provider value={getGlobalContext()}>{children}</GlobalContext.Provider>;
};
export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error("useGlobalContext must be used within a GlobalContextProvider");
  }
  return context;
};

export const serializeGlobalContext = (context) => {
  const serializableContext = Object.fromEntries(Object.entries(context).filter(([_, value]) => !(value instanceof Function)));
  // const base64 = btoa(jsonContext);

  const dedicatedSerializer = {
    selectedWorkspacesIds: (value) => [...value],
    activeNeurons: (value) => [...value],
    activeDatasets: (value) => Object.keys(value),
  };

  const forbiddenKeys = ["_model", "layoutManager", "datasets", "availableNeurons", "store"];

  function replacer() {
    return (key, value) => {
      if (forbiddenKeys.includes(key)) {
        return undefined;
      }
      if (key === "") {
        return value;
      }
      if (key in dedicatedSerializer) {
        return dedicatedSerializer[key](value);
      }
      return value;
    };
  }
  console.log("context", context);
  const jsonContext = JSON.stringify(context, replacer());
  const ctx = YAML.stringify(JSON.parse(jsonContext));

  const geoJsonGz = pako.gzip(jsonContext);

  console.log("json", jsonContext);
  console.log("Parsed", JSON.parse(jsonContext));
  console.log("BASE64", btoa(jsonContext));
  console.log("YAML", ctx);
  console.log("BASE64", btoa(ctx));
  console.log("CMPR", geoJsonGz);
  console.log("STR", String.fromCharCode.apply(null, geoJsonGz));

  const b64encoded = btoa(String.fromCharCode.apply(null, geoJsonGz));

  console.log("BASE64", b64encoded);

  const xxx = msgpack.encode(JSON.parse(jsonContext));
  console.log("MSGPACK", xxx);

  console.log("COMPRESSED", pako.gzip(xxx));
  console.log("BASE64", btoa(String.fromCharCode.apply(null, pako.gzip(xxx))));
  return jsonContext;
};
