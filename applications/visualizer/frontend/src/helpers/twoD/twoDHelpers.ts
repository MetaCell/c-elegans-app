import type { Core, ElementDefinition, Position } from "cytoscape";
import { ViewerType, Visibility, type Workspace } from "../../models";
import type { Connection } from "../../rest";
import { GRAPH_LAYOUTS, LAYOUT_OPTIONS, annotationLegend } from "../../settings/twoDSettings.tsx";
import { cellConfig, neurotransmitterConfig } from "./coloringHelper.ts";
import { getDefaultViewerData } from "../../models/models.ts";
import { getConcentricLayoutPositions } from "./concentricLayoutHelper.ts";

export const createEdge = (id: string, conn: Connection, workspace: Workspace, includeAnnotations: boolean, width: number): ElementDefinition => {
  const synapses = conn.synapses || {};
  const annotations = conn.annotations || [];

  const label = createEdgeLabel(workspace, synapses);
  const longLabel = createEdgeLongLabel(workspace, synapses);

  let annotationClasses: string[] = [];

  if (includeAnnotations) {
    annotationClasses = annotations.map((annotation) => annotationLegend[annotation]?.id).filter(Boolean);
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
      width,
    },
    classes: classes,
  };
};

// Helper functions to create edge labels
const createEdgeLabel = (workspace: Workspace, synapses: Record<string, number>) => {
  const datasets = Object.values(workspace.activeDatasets).map((dataset) => dataset.id);
  return datasets.map((datasetId) => synapses[datasetId] || 0).join(",");
};

const createEdgeLongLabel = (workspace: Workspace, synapses: Record<string, number>) => {
  const datasets = Object.values(workspace.activeDatasets);
  return datasets
    .map((dataset) => {
      const datasetLabel = synapses[dataset.id] || 0;
      return `${dataset.name}: ${datasetLabel}`;
    })
    .join("\n");
};

export const createNode = (
  nodeId: string,
  selected: boolean,
  attributes: string[],
  position?: Position,
  isGroupNode?: boolean,
  parent?: string, // Optional parent node ID for compound nodes
  activeNeuron?: boolean,
): ElementDefinition => {
  let classes = "";
  if (isGroupNode) classes += "groupNode ";
  if (selected) classes += "selected ";
  if (activeNeuron) classes += "searchedfor ";

  const node: ElementDefinition = {
    group: "nodes",
    data: {
      id: nodeId,
      label: nodeId,
      ...attributes.reduce((acc, attr) => ({ ...acc, [attr]: true }), {}),
      parent: parent || undefined, // Set the parent if provided
    },
    classes: classes,
  };
  if (position) {
    node.position = { x: position.x, y: position.y };
  }
  return node;
};

export function applyLayout(cy: Core, layout: GRAPH_LAYOUTS) {
  const options = getLayoutOptions(cy, layout);
  cy.makeLayout(options).run();

  refreshLayout(cy);
}

function getLayoutOptions(cy: Core, layout: GRAPH_LAYOUTS) {
  const baseOptions = LAYOUT_OPTIONS[layout];

  if (layout === GRAPH_LAYOUTS.Concentric) {
    return {
      ...baseOptions,
      positions: getConcentricLayoutPositions(cy),
    };
  }

  return baseOptions;
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
  const cellAttributes = neuron.type
    .split("")
    .map((char) => cellConfig[char]?.type)
    .filter(Boolean);
  const neurotransmitterAttributes = neuron.neurotransmitter
    .split("")
    .map((char) => neurotransmitterConfig[char]?.type)
    .filter(Boolean);

  return [...cellAttributes, ...neurotransmitterAttributes];
};

export const getNclassSet = (neuronIds: Set<string>, workspace: Workspace): Set<string> => {
  const nclassSet = new Set<string>();
  for (const neuronId of neuronIds) {
    const neuron = workspace.availableNeurons[neuronId];
    if (neuron?.nclass) {
      nclassSet.add(neuron.nclass);
    }
  }
  return nclassSet;
};

export const calculateMeanPosition = (nodeIds: string[], workspace: Workspace): Position => {
  let totalX = 0;
  let totalY = 0;
  let count = 0;

  for (const nodeId of nodeIds) {
    const neuron = workspace.visibilities[nodeId];
    const position = neuron?.[ViewerType.Graph]?.defaultPosition;
    if (position) {
      totalX += position.x;
      totalY += position.y;
      count++;
    }
  }

  return {
    x: totalX / count,
    y: totalY / count,
  };
};

// This functions is a complete copy from the original nemanode code
export const calculateSplitPositions = (nodes, basePosition) => {
  const { x: offsetX, y: offsetY } = basePosition;
  const positions = {};
  const n = nodes.length;

  if (n === 1) {
    positions[nodes[0]] = { x: offsetX, y: offsetY };
    return positions;
  }
  if (n === 2) {
    positions[nodes[0]] = { x: offsetX - 35, y: offsetY };
    positions[nodes[1]] = { x: offsetX + 35, y: offsetY };
  } else if (n === 3) {
    positions[nodes[0]] = { x: offsetX, y: offsetY - 35 };
    positions[nodes[1]] = { x: offsetX - 35, y: offsetY + 35 };
    positions[nodes[2]] = { x: offsetX + 35, y: offsetY + 35 };
  } else if (n === 4 && nodes[0] === "RMED") {
    positions[nodes[0]] = { x: offsetX, y: offsetY - 50 };
    positions[nodes[1]] = { x: offsetX - 50, y: offsetY };
    positions[nodes[2]] = { x: offsetX + 50, y: offsetY };
    positions[nodes[3]] = { x: offsetX, y: offsetY + 50 };
  } else if (n === 4) {
    positions[nodes[0]] = { x: offsetX - 35, y: offsetY - 35 };
    positions[nodes[1]] = { x: offsetX + 35, y: offsetY - 35 };
    positions[nodes[2]] = { x: offsetX - 35, y: offsetY + 35 };
    positions[nodes[3]] = { x: offsetX + 35, y: offsetY + 35 };
  } else if (n === 6) {
    positions[nodes[0]] = { x: offsetX - 35, y: offsetY - 60 };
    positions[nodes[1]] = { x: offsetX + 35, y: offsetY - 60 };
    positions[nodes[2]] = { x: offsetX - 70, y: offsetY };
    positions[nodes[3]] = { x: offsetX + 70, y: offsetY };
    positions[nodes[4]] = { x: offsetX - 35, y: offsetY + 60 };
    positions[nodes[5]] = { x: offsetX + 35, y: offsetY + 60 };
  } else {
    const r = 70;
    for (let i = 0; i < n; i++) {
      const theta = (-i * 2 * Math.PI) / n;
      positions[nodes[i]] = {
        x: offsetX - r * Math.sin(theta),
        y: offsetY - r * Math.cos(theta),
      };
    }
  }
  return positions;
};

export const updateWorkspaceNeurons2DViewerData = (workspace: Workspace, cy: Core) => {
  // Update the workspace availableNeurons with the positions and visibility
  workspace.customUpdate((draft) => {
    // Set visibility and position for nodes in the cytoscape graph
    for (const node of cy.nodes()) {
      const neuronId = node.id();
      if (!(neuronId in draft.visibilities)) {
        draft.visibilities[neuronId] = getDefaultViewerData(Visibility.Visible);
      }
      draft.visibilities[neuronId][ViewerType.Graph].defaultPosition = { ...node.position() };
      draft.visibilities[neuronId][ViewerType.Graph].visibility = Visibility.Visible;
    }
  });
};

export function getVisibleActiveNeuronsIn2D(workspace: Workspace): Set<string> {
  const activeVisibleNeurons = Array.from(workspace.activeNeurons).filter((neuronId) => {
    return workspace.visibilities[neuronId]?.[ViewerType.Graph]?.visibility === Visibility.Visible;
  });

  // Create a set to store the class neurons that are active and visible
  const activeVisibleClasses = new Set(
    activeVisibleNeurons.filter((neuronId) => {
      const neuron = workspace.availableNeurons[neuronId];
      return neuron && isNeuronClass(neuronId, workspace);
    }),
  );

  // Filter out individual cells if their class neuron is active and visible
  return new Set(
    activeVisibleNeurons.filter((neuronId) => {
      const neuron = workspace.availableNeurons[neuronId];
      const isCellFilteredOut = neuron && neuron.name !== neuron.nclass && activeVisibleClasses.has(neuron.nclass);

      return !isCellFilteredOut; // Return only those that should not be filtered out
    }),
  );
}

export function getHiddenNeuronsIn2D(workspace: Workspace): Set<string> {
  return new Set(
    Object.entries(workspace.visibilities)
      .filter(([_, data]) => data[ViewerType.Graph].visibility === Visibility.Hidden)
      .map(([name, _]) => name),
  );
}

export function isNeuronPartOfClosedGroup(neuronId: string, workspace: Workspace, openGroups: Set<string>): boolean {
  return Object.entries(workspace.neuronGroups).some(([groupId, group]) => {
    return group.neurons.has(neuronId) && !openGroups.has(groupId);
  });
}
