// src/helpers/twoD/graphDiffUtils.ts
import type { Core, ElementDefinition, CollectionReturnValue } from "cytoscape";
import { createEdge, createNode } from "./twoDHelpers";
import type { Connection } from "../../rest";
import type { Workspace } from "../../models";

export const computeGraphDifferences = (cy: Core, connections: Connection[], workspace: Workspace) => {
  const currentNodes = new Set(cy.nodes().map((node) => node.id()));
  const currentEdges = new Set(cy.edges().map((edge) => edge.id()));

  const newNodes = new Set<string>();
  const newEdges = new Set<string>();

  const nodesToAdd: ElementDefinition[] = [];
  const nodesToRemove: CollectionReturnValue = cy.collection();
  const edgesToAdd: ElementDefinition[] = [];
  const edgesToRemove: CollectionReturnValue = cy.collection();

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

  for (const nodeId of filteredActiveNeurons) {
    newNodes.add(nodeId);
    if (!currentNodes.has(nodeId)) {
      nodesToAdd.push(createNode(nodeId, workspace.selectedNeurons.has(nodeId)));
    }
  }

  for (const nodeId of currentNodes) {
    if (!newNodes.has(nodeId)) {
      nodesToRemove.merge(cy.getElementById(nodeId));
    }
  }

  for (const conn of connections) {
    const edgeId = `${conn.pre}-${conn.post}`;
    newEdges.add(edgeId);
    if (!currentEdges.has(edgeId)) {
      edgesToAdd.push(createEdge(conn));
    }
  }

  for (const edgeId of currentEdges) {
    if (!newEdges.has(edgeId)) {
      edgesToRemove.merge(cy.getElementById(edgeId));
    }
  }

  return { nodesToAdd, nodesToRemove, edgesToAdd, edgesToRemove };
};
