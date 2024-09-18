import type { Position } from "cytoscape";
import type { Dataset, Neuron } from "../rest";

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

export interface GraphViewerData {
  defaultPosition: Position | null;
  visibility: Visibility;
}

export interface ThreeDViewerData {
  visibility: Visibility;
  color: string;
}

export function getDefaultViewerData(visibility?: Visibility): ViewerData {
  return {
    [ViewerType.Graph]: {
      defaultPosition: null,
      visibility: visibility ?? Visibility.Hidden,
    },
    [ViewerType.ThreeD]: {
      visibility: visibility ?? Visibility.Hidden,
      color: "#000000",
    },
  };
}

export interface ViewerData {
  [ViewerType.Graph]?: GraphViewerData;
  [ViewerType.ThreeD]?: ThreeDViewerData;
  [ViewerType.EM]?: any; // Define specific data for EM viewer if needed
  [ViewerType.InstanceDetails]?: any; // Define specific data for Instance Details viewer if needed
}

const buildUrlFromFormat = (s: string, param: string) => {
  return s.replace(s.match("{[^}]+}")?.[0], param);
};

export function getNeuronUrlForDataset(neuron: Neuron, datasetId: string): string[] {
  return neuron.model3DUrls.map((url) => buildUrlFromFormat(url, datasetId));
}

export function getNeuronURL(dataset: Dataset, neuronName: string): string {
  return buildUrlFromFormat(dataset.neuron3DUrl, neuronName);
}

export function getSegmentationURL(dataset: Dataset, sliceIndex: number): string {
  return buildUrlFromFormat(dataset.emData.segmentation_url, sliceIndex?.toString());
}

export function getEMDataURL(dataset: Dataset, sliceIndex: number): string {
  return buildUrlFromFormat(dataset.emData.resource_url, sliceIndex?.toString());
}

export enum Alignment {
  Left = "left",
  Right = "right",
  Top = "top",
  Bottom = "bottom",
  Horizontal = "Horizontal",
  Vertical = "Vertical",
}

export enum Visibility {
  Visible = "Visible",
  Hidden = "Hidden",
  Unset = "Unset",
}
