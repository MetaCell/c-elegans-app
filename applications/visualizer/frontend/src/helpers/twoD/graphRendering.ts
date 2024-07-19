// src/helpers/twoD/graphDiffUtils.ts
import { Core } from 'cytoscape';
import { createEdge, createNode } from './twoDHelpers';

export const computeGraphDifferences = (cy: Core, connections: any[], workspace: any) => {
    const currentNodes = new Set(cy.nodes().map(node => node.id()));
    const currentEdges = new Set(cy.edges().map(edge => edge.id()));

    const newNodes = new Set<string>();
    const newEdges = new Set<string>();

    const nodesToAdd: any[] = [];
    const nodesToRemove: any[] = [];
    const edgesToAdd: any[] = [];
    const edgesToRemove: any[] = [];

    // Compute new nodes and edges based on the current connections and workspace state
    const filteredActiveNeurons = Array.from(workspace.activeNeurons).filter((neuronId: string) => {
        const neuron = workspace.availableNeurons[neuronId];
        if (!neuron) {
            return false;
        }
        const nclass = neuron.nclass;
        if (neuronId === nclass) {
            return true;
        }
        return !(workspace.activeNeurons.has(neuronId) && workspace.activeNeurons.has(nclass));
    });

    filteredActiveNeurons.forEach((nodeId: string) => {
        newNodes.add(nodeId);
        if (!currentNodes.has(nodeId)) {
            nodesToAdd.push(createNode(nodeId, workspace.selectedNeurons.has(nodeId)));
        }
    });

    currentNodes.forEach(nodeId => {
        if (!newNodes.has(nodeId)) {
            nodesToRemove.push(cy.getElementById(nodeId));
        }
    });

    connections.forEach(conn => {
        const edgeId = `${conn.pre}-${conn.post}`;
        newEdges.add(edgeId);
        if (!currentEdges.has(edgeId)) {
            edgesToAdd.push(createEdge(conn));
        }
    });

    currentEdges.forEach(edgeId => {
        if (!newEdges.has(edgeId)) {
            edgesToRemove.push(cy.getElementById(edgeId));
        }
    });

    return { nodesToAdd, nodesToRemove: cy.collection(nodesToRemove), edgesToAdd, edgesToRemove: cy.collection(edgesToRemove) };
};
