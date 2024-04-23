import {ViewerSynchronizationPair, ViewerType, Workspace} from "../models.ts";
import getLayoutManagerAndStore from "../layout-manager/layoutManagerFactory.ts";


export const createEmptyWorkspace = (name: string): Workspace => {
        // Generate a unique ID for the workspace
        const workspaceId = `workspace-${Date.now()}`;

        const {layoutManager, store} = getLayoutManagerAndStore();

        return {
            id: workspaceId,
            name: name,
            viewers: {
                [ViewerType.Graph]: true,
                [ViewerType.ThreeD]: true,
                [ViewerType.EM]: false,
                [ViewerType.InstanceDetails]: false,
            },
            datasets: new Set<string>(),
            neurons: new Set<string>(),
            synchronizations: {
                [ViewerSynchronizationPair.Graph_InstanceDetails]: true,
                [ViewerSynchronizationPair.Graph_ThreeD]: true,
                [ViewerSynchronizationPair.ThreeD_EM]: true
            },
            neuronGroups: {},
            store: store,
            layoutManager: layoutManager,
            highlightedNeuron: undefined,
        };

    }
;

