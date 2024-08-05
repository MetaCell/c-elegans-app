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
  'z-compound-depth': 'auto'
};

const SELECTED_NODE_STYLE = {
  "border-width": 2,
  "border-color": "black",
  "border-opacity": 1,
  'z-compound-depth': 'top'
};

const EDGE_STYLE = {
  "line-color": "#63625F",
  "target-arrow-color": "#63625F",
  "target-arrow-shape": "triangle",
  "curve-style": "bezier",
  "arrow-scale": 0.3,
  'z-compound-depth': 'top'
};

const CHEMICAL_STYLE = { "line-color": "#63625F", width: 0.5 };
const ELECTRICAL_STYLE = { "line-color": "yellow", width: 0.5,  };

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
  ...EDGE_LABEL_STYLES,
  ...FADED_STYLE,
  ...ANNOTATION_STYLES,
] as Stylesheet[];
