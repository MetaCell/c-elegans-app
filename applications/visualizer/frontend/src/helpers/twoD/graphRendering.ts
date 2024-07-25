// src/helpers/twoD/graphDiffUtils.ts
import type { Core, ElementDefinition, CollectionReturnValue } from 'cytoscape';
import { createEdge, createNode } from './twoDHelpers';
import {Workspace} from "../../models";
import {Connection} from "../../rest";

const getGroupedNeurons = (workspace: Workspace): Set<string> => {
  const groupedNeurons = new Set<string>();
  for (const groupId in workspace.neuronGroups) {
    for (const neuronId of workspace.neuronGroups[groupId].neurons) {
      groupedNeurons.add(neuronId);
    }
  }
  return groupedNeurons;
};

const getNeuronGroupId = (neuronId: string, workspace: Workspace): string | null => {
  for (const groupId in workspace.neuronGroups) {
    if (workspace.neuronGroups[groupId].neurons.has(neuronId)) {
      return groupId;
    }
  }
  return null;
};

export const computeGraphDifferences = (cy: Core, connections: Connection[], workspace: Workspace) => {
  // Current nodes and edges in the Cytoscape instance
  const currentNodes = new Set(cy.nodes().map((node) => node.id()));
  const currentEdges = new Set(cy.edges().map((edge) => edge.id()));

  // Expected nodes and edges
  const expectedNodes = new Set<string>();
  const expectedEdges = new Set<string>();

  const nodesToAdd: ElementDefinition[] = [];
  const nodesToRemove: CollectionReturnValue = cy.collection();
  const edgesToAdd: ElementDefinition[] = [];
  const edgesToRemove: CollectionReturnValue = cy.collection();

  // Compute expected nodes based on workspace.activeNeurons and connections
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

  // Add active neurons to expected nodes
  for (const neuronId of filteredActiveNeurons) {
    expectedNodes.add(neuronId);
  }

  // Add nodes from connections to expected nodes
  for (const conn of connections) {
    expectedNodes.add(conn.pre);
    expectedNodes.add(conn.post);

    const edgeId = `${conn.pre}-${conn.post}-${conn.type}`;
    expectedEdges.add(edgeId);
  }

  // Determine nodes to add and remove
  for (const nodeId of expectedNodes) {
    if (!currentNodes.has(nodeId)) {
      nodesToAdd.push(createNode(nodeId, workspace.selectedNeurons.has(nodeId)));
    }
  }

  for (const nodeId of currentNodes) {
    if (!expectedNodes.has(nodeId)) {
      nodesToRemove.merge(cy.getElementById(nodeId));
    }
  }

  // Determine edges to add and remove
  for (const edgeId of expectedEdges) {
    if (!currentEdges.has(edgeId)) {
      const [pre, post, type] = edgeId.split('-');
      edgesToAdd.push(createEdge({ pre, post, type }));
    }
  }

  for (const edgeId of currentEdges) {
    if (!expectedEdges.has(edgeId)) {
      edgesToRemove.merge(cy.getElementById(edgeId));
    }
  }

  // Return the differences to be applied to the Cytoscape instance
  return { nodesToAdd, nodesToRemove, edgesToAdd, edgesToRemove };
};
