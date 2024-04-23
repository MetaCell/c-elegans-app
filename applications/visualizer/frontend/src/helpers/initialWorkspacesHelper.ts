import {Workspace} from "../models.ts";
import getLayoutManagerAndStore from "../layout-manager/layoutManagerFactory.ts";

export const createEmptyWorkspace = (name: string): Workspace => {
    // Generate a unique ID for the workspace
    const workspaceId = `workspace-${Date.now()}`; // Simple unique ID generation

    const {layoutManager, store} = getLayoutManagerAndStore();

    return {
        id: workspaceId,
        name: name,
        viewers: [],
        datasets: [],
        neurons: [],
        synchronizations: [],
        store: store,
        layoutManager: layoutManager,
    };

};