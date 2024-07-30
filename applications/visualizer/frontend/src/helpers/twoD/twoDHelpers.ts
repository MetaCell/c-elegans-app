import type { Core, ElementDefinition } from "cytoscape";
import type { Connection } from "../../rest";
import type { Workspace } from "../../models/workspace.ts";
import {GraphType} from "../../settings/twoDSettings.tsx";
import {cellConfig, neurotransmitterConfig} from "./coloringHelper.ts";

export const createEdge = (id: string, conn: Connection, workspace: Workspace): ElementDefinition => {
  const synapses = conn.synapses || {};
  const annotations = conn.annotations || [];

  const label = createEdgeLabel(workspace, synapses);
  const longLabel = createEdgeLongLabel(workspace, synapses);

  return {
    group: "edges",
    data: {
      id: id,
      source: conn.pre,
      target: conn.post,
      label: label,
      longLabel: longLabel,
      type: conn.type,
      annotations: annotations.join(", ")
    },
    classes: conn.type,
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

export const createNode = (
  nodeId: string,
  selected: boolean,
  attributes: string[]
): ElementDefinition => {
  const data = { id: nodeId, label: nodeId };

  // Set each attribute in the data object to true
  attributes.forEach(attr => {
    data[attr] = true;
  });

  return {
    group: "nodes",
    data,
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
export const isNeuronCell = (neuronId: string, workspace: Workspace): boolean => {
  const neuron = workspace.availableNeurons[neuronId];
  return neuron ? neuron.name !== neuron.nclass : false;
};

export const isNeuronClass = (neuronId: string, workspace: Workspace): boolean => {
  const neuron = workspace.availableNeurons[neuronId];
  return neuron ? neuron.name === neuron.nclass : false;
};

export const getEdgeId = (conn: Connection): string => {
    const synapsesString = JSON.stringify(conn.synapses);
    const annotationsString = conn.annotations.join(",");
    return `${conn.pre}-${conn.post}-${conn.type}-${synapsesString}-${annotationsString}`;
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