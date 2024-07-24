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

export interface Dataset {
  name: string;
  neuron3DUrl: string;
  // Add other properties as needed
}

export interface Neuron {
  name: string;
  model3DUrl: string;
  // Add other properties as needed
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
