import type { Core, ElementDefinition } from "cytoscape";
import type { Connection } from "../../rest";
import type { Workspace } from "../../models/workspace.ts";
import {annotationLegend, LegendType} from "../../settings/twoDSettings.tsx";
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


