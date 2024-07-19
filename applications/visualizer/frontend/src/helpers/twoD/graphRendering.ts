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
  const currentNodes = new Set(cy.nodes().map((node) => node.id()));
  const currentEdges = new Set(cy.edges().map((edge) => edge.id()));

  const newNodes = new Set<string>();
  const newEdges = new Set<string>();

  const nodesToAdd: ElementDefinition[] = [];
  const nodesToRemove: CollectionReturnValue = cy.collection();
  const edgesToAdd: ElementDefinition[] = [];
  const edgesToRemove: CollectionReturnValue = cy.collection();

  const groupedNeurons = getGroupedNeurons(workspace);

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

  const groupNodes = new Set<string>();

  for (const neuronId of filteredActiveNeurons) {
    if (groupedNeurons.has(neuronId)) {
      continue; // Skip neurons that are part of a group
    }
    newNodes.add(neuronId);
    if (!currentNodes.has(neuronId)) {
      nodesToAdd.push(createNode(neuronId, workspace.selectedNeurons.has(neuronId)));
    }
  }

  for (const groupId in workspace.neuronGroups) {
    const group = workspace.neuronGroups[groupId];
    groupNodes.add(groupId);
    if (!currentNodes.has(groupId)) {
      nodesToAdd.push(createNode(groupId, workspace.selectedNeurons.has(groupId)));
    }
  }

  for (const nodeId of currentNodes) {
    if (!newNodes.has(nodeId) && !groupNodes.has(nodeId)) {
      nodesToRemove.merge(cy.getElementById(nodeId));
    }
  }

  const groupEdges = new Set<string>();

  for (const conn of connections) {
    const preNeuronGroup = getNeuronGroupId(conn.pre, workspace);
    const postNeuronGroup = getNeuronGroupId(conn.post, workspace);

    const pre = preNeuronGroup ? preNeuronGroup : conn.pre;
    const post = postNeuronGroup ? postNeuronGroup : conn.post;

    const edgeId = `${pre}-${post}-${conn.type}`;

    if (preNeuronGroup && postNeuronGroup) {
      // Connection from one group to another group
      if (!groupEdges.has(edgeId)) {
        groupEdges.add(edgeId);
        edgesToAdd.push(createEdge({ pre, post, type: conn.type }));
      }
    } else if (preNeuronGroup || postNeuronGroup) {
      // Connection between a neuron and a group
      if (!groupEdges.has(edgeId)) {
        groupEdges.add(edgeId);
        edgesToAdd.push(createEdge({ pre, post, type: conn.type }));
      }
    } else {
      // Connection between individual neurons
      newEdges.add(edgeId);
      if (!currentEdges.has(edgeId)) {
        edgesToAdd.push(createEdge({ pre: conn.pre, post: conn.post, type: conn.type }));
      }
    }
  }

  for (const edgeId of currentEdges) {
    if (!newEdges.has(edgeId) && !groupEdges.has(edgeId)) {
      edgesToRemove.merge(cy.getElementById(edgeId));
    }
  }

  return { nodesToAdd, nodesToRemove, edgesToAdd, edgesToRemove };
};
