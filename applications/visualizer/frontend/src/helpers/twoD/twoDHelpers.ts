import type { Core, ElementDefinition } from "cytoscape";
import type { Connection } from "../../rest";
import type { Workspace } from "../../models/workspace.ts";
import {GraphType} from "../../settings/twoDSettings.tsx";

export const CONNECTION_SEPARATOR = '-'

export const createEdge = (conn: Connection): ElementDefinition => {
  return {
    group: "edges",
    data: {
      id: `${conn.pre}-${conn.post}`,
      source: conn.pre,
      target: conn.post,
      label: conn.type,
      type: conn.type,
    },
    classes: conn.type,
  };
};

export const createNode = (nodeId: string, selected: boolean): ElementDefinition => {
  return {
    group: "nodes",
    data: { id: nodeId, label: nodeId },
    classes: selected ? "selected" : "",
  };
};

export function applyLayout(cyRef: React.MutableRefObject<Core | null>, layout: string) {
  if (cyRef.current) {
    cyRef.current
      .layout({
        name: layout,
      })
      .run();
  }
}

export const updateHighlighted = (cy, inputIds, selectedIds, legendHighlights) => {
  // Remove all highlights and return if nothing is selected and no legend item activated.
  cy.elements().removeClass("faded");
  if (selectedIds.length === 0 && legendHighlights.length === 0) {
    return;
  }

  // Use selected nodes as source if present, otherwise use input nodes.
  const sourceIds = selectedIds.length ? selectedIds : inputIds;
  let sourceNodes = cy.collection();

  sourceIds.forEach((id) => {
    const node = cy.getElementById(id);

    if (node.isParent()) {
      sourceNodes = sourceNodes.union(node.children());
    } else {
      sourceNodes = sourceNodes.union(node);
    }
  });

  // Filter network by edges, as set by legend.
  let edgeSel = "edge";
  legendHighlights.forEach((highlight, type) => {
    if (type === GraphType.Connection) {
      edgeSel += `[type="${highlight}"]`;
    }
  });

  let connectedNodes = sourceNodes.neighborhood(edgeSel).connectedNodes();

  // Filter network by nodes, as set by legend.
  legendHighlights.forEach((highlight, type) => {
    if (type === GraphType.Node) {
      connectedNodes = connectedNodes.filter("[?" + highlight + "]");
    }
  });

  // Filter to the neighborhood of the selected nodes.
  if (selectedIds.length > 0) {
    let allowedNodes = cy.collection();

    for (let i = 0; i < sourceNodes.length; i++) {
      const sourceNode = sourceNodes[i];
      const nodes = sourceNode.neighborhood(edgeSel).connectedNodes();

      if (i === 0) {
        allowedNodes = allowedNodes.union(nodes);
      } else {
        allowedNodes = allowedNodes.intersection(nodes);
      }
    }
    connectedNodes = connectedNodes.intersection(allowedNodes);
  }

  // Fade out any nodes and edges that were filtered out.
  let highlightedNodes = sourceNodes.union(connectedNodes);
  highlightedNodes = highlightedNodes.union(highlightedNodes.parents());

  let highlightedEdges = highlightedNodes.edgesWith(highlightedNodes);
  highlightedEdges = highlightedEdges.filter(edgeSel);

  cy.elements().not(highlightedNodes).not(highlightedEdges).addClass("faded");
};

// Helper functions
export const isCell = (neuronId: string, workspace: Workspace): boolean => {
  const neuron = workspace.availableNeurons[neuronId];
  return neuron ? neuron.name !== neuron.nclass : false;
};

export const isClass = (neuronId: string, workspace: Workspace): boolean => {
  const neuron = workspace.availableNeurons[neuronId];
  return neuron ? neuron.name === neuron.nclass : false;
};

export const getEdgeName = (pre: string, post: string, type: string): string => {
  return `${pre}${CONNECTION_SEPARATOR}${post}${CONNECTION_SEPARATOR}${type}`;
}