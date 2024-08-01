import type {Core, ElementDefinition, Position} from "cytoscape";
import type {Connection} from "../../rest";
import type {Workspace} from "../../models/workspace.ts";
import {ViewerType} from "../../models/models.ts";
import {annotationLegend} from "../../settings/twoDSettings.tsx";
import {cellConfig, neurotransmitterConfig} from "./coloringHelper.ts";

export const createEdge = (id: string, conn: Connection, workspace: Workspace, includeAnnotations: boolean): ElementDefinition => {
    const synapses = conn.synapses || {};
    const annotations = conn.annotations || [];

    const label = createEdgeLabel(workspace, synapses);
    const longLabel = createEdgeLongLabel(workspace, synapses);

    let annotationClasses: string[] = [];

    if (includeAnnotations) {
        annotationClasses = annotations.map(annotation => annotationLegend[annotation]?.id).filter(Boolean);
        if (annotationClasses.length === 0) {
            annotationClasses.push(annotationLegend.notClassified.id);
        }
    } else {
        annotationClasses.push(conn.type);
    }

    const classes = annotationClasses.join(" ");

    return {
        group: "edges",
        data: {
            id: id,
            source: conn.pre,
            target: conn.post,
            label: label,
            longLabel: longLabel,
            type: conn.type,
        },
        classes: classes,
    };
};


// Helper functions to create edge labels
const createEdgeLabel = (workspace: Workspace, synapses: Record<string, number>) => {
    const datasets = Object.values(workspace.activeDatasets).map(dataset => dataset.id);
    return datasets.map(datasetId => synapses[datasetId] || 0).join(',');
};

const createEdgeLongLabel = (workspace: Workspace, synapses: Record<string, number>) => {
    const datasets = Object.values(workspace.activeDatasets)
    return datasets.map(dataset => {
        const datasetLabel = synapses[dataset.id] || 0;
        return `${dataset.name}: ${datasetLabel}`;
    }).join('\n');
};

export const createNode = (nodeId: string, selected: boolean, attributes: string[], position?: Position): ElementDefinition => {
    const node: ElementDefinition = {
        group: "nodes",
        data: {id: nodeId, label: nodeId, ...attributes.reduce((acc, attr) => ({...acc, [attr]: true}), {})},
        classes: selected ? "selected" : ""
    };
    if (position) {
        node.position = position;
    }
    return node;
};

export function applyLayout(cy: Core, layout: string) {
    cy.layout({
        name: layout,
    }).run();

    refreshLayout(cy)
}

export function refreshLayout(cy: Core) {
    cy.resize(); // Adjust the viewport size
    cy.center(); // Center the graph in the container
    cy.fit(); // Fit the graph to the container
}

// Helper functions
export const isNeuronCell = (neuronId: string, workspace: Workspace): boolean => {
    const neuron = workspace.availableNeurons[neuronId];
    return neuron ? neuron.name !== neuron.nclass : false;
};

export const isNeuronClass = (neuronId: string, workspace: Workspace): boolean => {
    const neuron = workspace.availableNeurons[neuronId];
    return neuron ? neuron.name === neuron.nclass : false;
};

export const getEdgeId = (conn: Connection, includeAnnotations: boolean): string => {
    const synapsesString = JSON.stringify(conn.synapses);
    const annotationsString = conn.annotations.join(",");
    return `${conn.pre}-${conn.post}-${conn.type}-${synapsesString}-${annotationsString}-${includeAnnotations}`;
};


export const extractNeuronAttributes = (neuron) => {
    const cellAttributes = neuron.type.split('').map(char => cellConfig[char]?.type).filter(Boolean);
    const neurotransmitterAttributes = neuron.neurotransmitter.split('').map(char => neurotransmitterConfig[char]?.type).filter(Boolean);

    return [...cellAttributes, ...neurotransmitterAttributes];
};

export const getNclassSet = (neuronIds: Set<string>, workspace: Workspace): Set<string> => {
    const nclassSet = new Set<string>();
    neuronIds.forEach(neuronId => {
        const neuron = workspace.availableNeurons[neuronId];
        if (neuron && neuron.nclass) {
            nclassSet.add(neuron.nclass);
        }
    });
    return nclassSet;
};


export const calculateMeanPosition = (nodeIds: string[], cy: Core): Position => {
    let totalX = 0;
    let totalY = 0;
    let count = 0;

    nodeIds.forEach(nodeId => {
        const node = cy.getElementById(nodeId);
        if (node && node.position) {
            const position = node.position();
            totalX += position.x;
            totalY += position.y;
            count++;
        }
    });

    return {
        x: totalX / count,
        y: totalY / count
    };
};

export const updateWorkspaceNeurons2DViewerData = (workspace: Workspace, cy: Core) => {
    workspace.customUpdate(draft => {
        // Set visibility and position for nodes in the cytoscape graph
        cy.nodes().forEach(node => {
            const neuronId = node.id();
            if (draft.availableNeurons[neuronId]) {
                draft.availableNeurons[neuronId].viewerData[ViewerType.Graph] = {
                    ...draft.availableNeurons[neuronId].viewerData[ViewerType.Graph],
                    position: node.position(),
                    visibility: true,
                };
            }
        });

        // Set visibility to false and position to null for nodes not in the cytoscape graph
        Object.keys(draft.availableNeurons).forEach(neuronId => {
            if (!cy.getElementById(neuronId).isNode()) {
                draft.availableNeurons[neuronId].viewerData[ViewerType.Graph] = {
                    ...draft.availableNeurons[neuronId].viewerData[ViewerType.Graph],
                    position: null,
                    visibility: false,
                };
            }
        });
    });
}