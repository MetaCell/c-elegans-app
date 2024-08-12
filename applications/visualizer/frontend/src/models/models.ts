import type { Neuron } from "../rest";
import type { Position } from "cytoscape";

export enum ViewMode {
  Default = "Default",
  Compare = "Compare",
}

export enum ViewerType {
  Graph = "Graph",
  ThreeD = "3D",
  EM = "EM",
  InstanceDetails = "Instance Details",
}

export enum ViewerSynchronizationPair {
  Graph_InstanceDetails = 0,
  Graph_ThreeD = 1,
  ThreeD_EM = 2,
}

export interface NeuronGroup {
  id: string;
  name: string;
  color: string;
  neurons: Set<string>;
}

export interface EnhancedNeuron extends Neuron {
  viewerData: ViewerData;
}

export interface GraphViewerData {
  defaultPosition: Position | null;
  visibility: boolean;
}

export interface ViewerData {
  [ViewerType.Graph]?: GraphViewerData;
  [ViewerType.ThreeD]?: any; // Define specific data for 3D viewer if needed
  [ViewerType.EM]?: any; // Define specific data for EM viewer if needed
  [ViewerType.InstanceDetails]?: any; // Define specific data for Instance Details viewer if needed
}

const buildUrlFromFormat = (s: string, param: string) => {
  return s.replace(s.match("{.+}")?.[0], param);
};

export function getNeuronUrlForDataset(neuron: Neuron, datasetId: string) {
  return buildUrlFromFormat(neuron.model3DUrl, datasetId);
}

export function getNeuronURL(dataset: Dataset, neuronName: string) {
  return buildUrlFromFormat(dataset.neuron3DUrl, neuronName);
}
