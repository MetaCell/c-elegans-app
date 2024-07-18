import { ChemicalSynapseIcon, GapJunctionIcon } from "../icons";

export const CHEMICAL_THRESHOLD = 3;
export const ELECTRICAL_THRESHOLD = 2;

export const INCLUDE_NEIGHBORING_CELLS = false;
export const INCLUDE_ANNOTATIONS = true;

export const ZOOM_DELTA = 0.1;

export enum GRAPH_LAYOUTS {
  Force = "fcose",
  Hierarchical = "dagre",
  Concentric = "concentric",
}

export enum GraphType {
  Node,
  Connection,
}

export const connectionsLegend = {
  chemical: {
    icon: <ChemicalSynapseIcon />,
    name: "Chemical Synapse",
  },
  electrical: {
    icon: <GapJunctionIcon />,
    name: "Gap Junction",
  },
};
