import type { Stylesheet } from "cytoscape";
import { annotationLegend } from "../settings/twoDSettings.tsx";

const SELECTED_NODE_STYLE = {
  "border-width": 2,
  "border-color": "black",
  "border-opacity": 1,
};

const GROUP_NODE_STYLE = {
  label: "Group",
  shape: "roundrectangle",
  "background-color": "#ECECE9",
  "font-size": "10px",
  width: 20,
  height: 20,
  "background-opacity": 0.7,
  padding: "7px",
  "text-wrap": "wrap",
  "text-valign": "center",
  "text-align": "center",
  color: "black",
  "border-width": 1,
  "border-color": "black",
  "font-weight": "semibold",
  "background-image": "none",
  "pie-size": "75%",
  "border-opacity": 1,
};

const UNSELECTED_GROUP_NODE_STYLE = {
  ...GROUP_NODE_STYLE,
  "background-color": "#D3D3CF",
  "border-width": 0,
};

const EDGE_STYLE = [
  {
    selector: "edge",
    style: {
      "line-color": "#63625F",
      "target-arrow-color": "#63625F",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
      "arrow-scale": 0.3,
      "source-distance-from-node": 1,
      "target-distance-from-node": 1,
      width: "data(width)",
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
];

const CHEMICAL_STYLE = [
  {
    selector: ".chemical",
    style: { "line-color": "#63625F", width: 0.5 },
  },
  {
    selector: "edge.chemical.parallel",
    style: {
      "curve-style": "unbundled-bezier",
      "control-point-distances": 40,
      "control-point-weights": 0.5,
    },
  },
];

const ELECTRICAL_STYLE = [
  {
    selector: ".electrical",
    style: {
      "line-color": "#63625F",
      width: 0.5,
      "curve-style": "segments",
      "target-arrow-color": "#666666",
      "source-arrow-color": "#666666",
      "segment-distances": "0 -4 4 -4 4 0",
      "segment-weights": (ele) => {
        const sourcePos = ele.source().position();
        const targetPos = ele.target().position();
        const length = Math.sqrt(Math.pow(targetPos.x - sourcePos.x, 2) + Math.pow(targetPos.y - sourcePos.y, 2));
        const divider = (length > 60 ? 7 : length > 40 ? 5 : 3) / length;
        return [-2.0, -1.5, -0.5, 0.5, 1.5, 2.0].map((d) => 0.5 + d * divider).join(" ");
      },
      "target-arrow-shape": "none",
    },
  },
  {
    selector: ".electrical:loop",
    css: {
      "target-arrow-shape": "tee",
      "source-arrow-shape": "tee",
    },
  },
];

const OPEN_GROUP_STYLE = {
  "background-image": "none",
  "pie-size": "0%",
  "text-valign": "top",
  "text-halign": "center",
  "text-background-opacity": 1,
  "text-background-shape": "roundrectangle",
  "text-border-width": 2,
  "text-background-padding": "2px",
  "text-margin-y": "-3px",
  "text-border-opacity": 1,
  "background-color": "#eaeaea",
  "border-color": "#d0d0d0",
  "text-background-color": "#d0d0d0",
  "text-border-color": "#d0d0d0",
  "border-opacity": 1,
  shape: "roundrectangle",
  "font-size": "10px",
  "background-opacity": 0.7,
  "text-wrap": "wrap",
  "text-align": "center",
  color: "black",
  "border-width": 3,
  "font-weight": "semibold",
  "text-border-radius": "8px",
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

const NODE_STYLE = [
  {
    selector: "node",
    style: {
      "background-color": "#666",
      label: "data(label)",
      color: "black",
      "text-valign": "center",
      "text-halign": "center",
      "font-size": 8,
      width: 24,
      height: 24,
    },
  },
  {
    selector: "node[?none], node[?muscle], node[?others]",
    css: {
      "font-size": "16px",
      shape: "roundrectangle",
      "text-margin-y": "2px",
      width: "label",
      height: "10px",
      padding: "12px",
    },
  },
  {
    selector: "node[?none], node[?muscle], node[?others]",
    css: {
      "font-size": "16px",
      shape: "roundrectangle",
      "text-margin-y": "2px",
      width: "label",
      height: "10px",
      padding: "12px",
    },
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
    selector: ".chemical",
    style: CHEMICAL_STYLE,
  },
  {
    selector: ":parent",
    style: OPEN_GROUP_STYLE,
  },
  {
    selector: ":parent.selected",
    style: {
      ...OPEN_GROUP_STYLE,
      "font-weight": "bold",
      padding: "9px",
      "text-margin-y": "-4px",
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
  ...NODE_STYLE,
  ...EDGE_STYLE,
  ...ELECTRICAL_STYLE,
  ...CHEMICAL_STYLE,
  ...EDGE_LABEL_STYLES,
  ...FADED_STYLE,
  ...ANNOTATION_STYLES,
] as Stylesheet[];
