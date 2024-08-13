import { ChemicalSynapseIcon, GapJunctionIcon } from "../icons";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export const CHEMICAL_THRESHOLD = 3;
export const ELECTRICAL_THRESHOLD = 2;

export const INCLUDE_NEIGHBORING_CELLS = true;
export const INCLUDE_ANNOTATIONS = false;
export const INCLUDE_LABELS = false;
export const INCLUDE_POST_EMBRYONIC = true;

export const ZOOM_DELTA = 0.1;

export enum GRAPH_LAYOUTS {
  Force = "fcose",
  Hierarchical = "dagre",
  Concentric = "concentric",
}

export enum LegendType {
  Node = 0,
  Connection = 1,
  Annotation = 2,
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

export const annotationLegend = {
  increase: {
    id: "increase",
    name: "Developmentally dynamic (added)",
    order: 1,
    color: "#FF0000",
    icon: <ArrowForwardIcon style={{ color: "#FF0000" }} />,
  },
  decrease: {
    id: "decrease",
    name: "Developmentally dynamic (pruned)",
    order: 2,
    color: "#2A9EFE",
    icon: <ArrowForwardIcon style={{ color: "#2A9EFE" }} />,
  },
  stable: {
    id: "stable",
    name: "Stable",
    order: 3,
    color: "black",
    icon: <ArrowForwardIcon style={{ color: "black" }} />,
  },
  variable: {
    id: "variable",
    name: "Variable",
    order: 4,
    color: "#d1cfcf",
    icon: <ArrowForwardIcon style={{ color: "#d1cfcf" }} />,
  },
  postEmbryonic: {
    id: "post_embryonic",
    name: "Post-embryonic",
    order: 5,
    color: "#990000",
    icon: <ArrowForwardIcon style={{ color: "#990000" }} />,
  },
  notClassified: {
    id: "not_classified",
    name: "Not classified",
    order: 6,
    color: "#228B22",
    icon: <ArrowForwardIcon style={{ color: "#228B22" }} />,
  },
};


export const BOUNDING_BOX_BASENAME = "bbox_"