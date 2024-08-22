import type { Stylesheet } from "cytoscape";
import { annotationLegend } from "../settings/twoDSettings.tsx";

const NODE_STYLE = {
  "background-color": "#666",
  label: "data(label)",
  color: "#fff",
  "text-valign": "center",
  "text-halign": "center",
  "font-size": 8,
  width: 24,
  height: 24,
};

const SELECTED_NODE_STYLE = {
  "border-width": 2,
  "border-color": "black",
  "border-opacity": 1,
};

const GROUP_NODE_STYLE = {
  shape: "roundrectangle",
  "background-color": "#ECECE9",
  "pie-size": "100%",
  "font-size": 3,
  width: 20,
  height: 20,
  "background-opacity": 0.7,
  padding: "7px",
  "text-wrap": "wrap",
  "text-valign": "center",
  "text-halign": "center",
  color: "black",
  "border-width": 1,
  "border-color": "black",
  "font-weight": "semibold",
};
const UNSELECTED_GROUP_NODE_STYLE = {
  ...GROUP_NODE_STYLE,
  "background-color": "#D3D3CF",
  "border-width": 0,
};

const EDGE_STYLE = {
  "line-color": "#63625F",
  "target-arrow-color": "#63625F",
  "target-arrow-shape": "triangle",
  "curve-style": "bezier",
  "arrow-scale": 0.3,
  "source-distance-from-node": 1,
  "target-distance-from-node": 1,
};

const CHEMICAL_STYLE = { "line-color": "#63625F", width: 0.5 };
const ELECTRICAL_STYLE = {
  "line-color": "#63625F",
  width: 0.5,
  "curve-style": "segments",
  "target-arrow-color": "#666666",
  "source-arrow-color": "#666666",
  "segment-distances": "0 -4 4 -4 4 0",
  "segment-weights": [-2.0, -1.5, -0.5, 0.5, 1.5, 2.0],
  "target-arrow-shape": "none",
};

const FADED_STYLE = [
  {
    selector: ".faded",
    css: {
      opacity: 0.3,
      "background-image-opacity": 0.2,
    },
  },
  {
    selector: "edge.faded",
    css: {
      opacity: 0.1,
    },
  },
];

const EDGE_LABEL_STYLES = [
  {
    selector: "edge.hover, edge.showEdgeLabel",
    style: {
      label: "data(label)",
      "font-size": "4px",
      "text-background-color": "#FFF",
      "text-background-opacity": 1,
      "text-background-padding": "3px",
      "z-index": 10,
      "text-border-radius": "8px",
      "z-compound-depth": "top",
      shape: "roundrectangle",
    },
  },
  {
    selector: "edge.focus",
    style: {
      label: "data(longLabel)",
      "font-size": "4px",
      "text-wrap": "wrap",
      "text-background-color": "#FFF",
      "text-background-opacity": 1,
      "text-background-padding": "3px",
      "z-index": 10,
      "text-border-radius": "8px",
    },
  },
];

const ANNOTATION_STYLES = Object.entries(annotationLegend).map(([, { id, color }]) => ({
  selector: `.${id}`,
  style: {
    "line-color": color,
    "target-arrow-color": color,
  },
}));

export const GRAPH_STYLES = [
  {
    selector: "node",
    style: NODE_STYLE,
  },
  {
    selector: "node.groupNode.selected",
    style: GROUP_NODE_STYLE,
  },
  {
    selector: "node.groupNode",
    style: UNSELECTED_GROUP_NODE_STYLE,
  },
  {
    selector: "node.selected",
    style: SELECTED_NODE_STYLE,
  },
  {
    selector: "edge",
    style: EDGE_STYLE,
  },
  {
    selector: ".chemical",
    style: CHEMICAL_STYLE,
  },
  {
    selector: ".electrical",
    style: ELECTRICAL_STYLE,
  },
  {
    selector: ".electrical:loop",
    css: {
      "target-arrow-shape": "tee",
      "source-arrow-shape": "tee",
    },
  },
  {
    selector: "edge:loop",
    css: {
      "source-distance-from-node": 0,
      "target-distance-from-node": 0,
      "arrow-scale": 0.3,
    },
  },
  ...EDGE_LABEL_STYLES,
  ...FADED_STYLE,
  ...ANNOTATION_STYLES,
] as Stylesheet[];
