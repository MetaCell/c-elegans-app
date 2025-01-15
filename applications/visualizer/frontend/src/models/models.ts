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
}

export enum ViewerSynchronizationPair {
  Graph_ThreeD = 0,
  ThreeD_EM = 1,
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

export interface EMViewerData {
  visibility: Visibility;
  color: string;
}

export interface EMViewerSettings {
  showNeurons: boolean;
  showSynapses: boolean;
  startSlice: number;
}

function randomColor(): string {
  return `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0")}`;
}

export function getDefaultViewerData(visibility?: Visibility): ViewerData {
  const color = randomColor();
  return {
    [ViewerType.Graph]: {
      defaultPosition: null,
      visibility: visibility ?? Visibility.Hidden,
    },
    [ViewerType.ThreeD]: {
      visibility: visibility ?? Visibility.Hidden,
      color,
    },
    [ViewerType.EM]: {
      visibility: visibility ?? Visibility.Hidden,
      color,
    },
  };
}

export interface ViewerData {
  [ViewerType.Graph]?: GraphViewerData;
  [ViewerType.ThreeD]?: ThreeDViewerData;
  [ViewerType.EM]?: EMViewerData;
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
  return buildUrlFromFormat(dataset.emData.segmentationUrl, sliceIndex?.toString());
}

export function getEMDataURL(dataset: Dataset, sliceIndex: number): string {
  return buildUrlFromFormat(dataset.emData.resourceUrl, sliceIndex?.toString());
}

export function getSynapsesSegmentationURL(dataset: Dataset, sliceIndex: number): string {
  return buildUrlFromFormat(dataset.emData.synapsesSegmentationUrl, sliceIndex?.toString());
}

export function getEMResolution(dataset: Dataset) {
  return dataset.emData?.segmentationSize || dataset.emData?.maxResolution;
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
