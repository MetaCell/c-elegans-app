import type { Stylesheet } from "cytoscape";
import { annotationLegend } from "../settings/twoDSettings.tsx";

const searchedforNeuronBackground =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NSIgaGVpZ2h0PSI2NSIgdmlld0JveD0iMCAwIDY1IDY1Ij48ZWxsaXBzZSByeT0iMTkuODkiIHJ4PSIuOTc1IiBjeT0iLS4wMTkiIGN4PSIyNC45NDgiIHRyYW5zZm9ybT0icm90YXRlKDQ1KSIvPjxlbGxpcHNlIHJ5PSIyOS4wNTUiIHJ4PSIuOTc1IiBjeT0iLjA0NiIgY3g9IjQ2LjAwOCIgdHJhbnNmb3JtPSJyb3RhdGUoNDUpIi8+PGVsbGlwc2Ugcnk9IjEyLjE1NSIgcng9Ii45NzUiIGN5PSItLjAxOSIgY3g9IjcyLjMzMyIgdHJhbnNmb3JtPSJyb3RhdGUoNDUpIi8+PGVsbGlwc2Ugcnk9IjEyLjE1NSIgcng9Ii45NzUiIGN5PSItLjAxOSIgY3g9IjE5LjY4MyIgdHJhbnNmb3JtPSJyb3RhdGUoNDUpIi8+PGVsbGlwc2Ugcnk9IjI0LjIxMiIgcng9Ii45NzUiIGN5PSItLjAxOSIgY3g9IjYxLjgwMyIgdHJhbnNmb3JtPSJyb3RhdGUoNDUpIi8+PGVsbGlwc2Ugcnk9IjI2LjkxIiByeD0iLjk3NSIgY3k9Ii0uMDE5IiBjeD0iNTYuNTM4IiB0cmFuc2Zvcm09InJvdGF0ZSg0NSkiLz48ZWxsaXBzZSByeT0iMjguNTY3IiByeD0iLjk3NSIgY3k9Ii0uMDE5IiBjeD0iNTEuMjczIiB0cmFuc2Zvcm09InJvdGF0ZSg0NSkiLz48ZWxsaXBzZSByeT0iMjQuMjEyIiByeD0iLjk3NSIgY3k9Ii0uMDE5IiBjeD0iMzAuMjEzIiB0cmFuc2Zvcm09InJvdGF0ZSg0NSkiLz48ZWxsaXBzZSByeT0iMjYuOTEiIHJ4PSIuOTc1IiBjeT0iLS4wMTkiIGN4PSIzNS40NzgiIHRyYW5zZm9ybT0icm90YXRlKDQ1KSIvPjxlbGxpcHNlIHJ5PSIyOC41NjciIHJ4PSIuOTc1IiBjeT0iLS4wMTkiIGN4PSI0MC43NDMiIHRyYW5zZm9ybT0icm90YXRlKDQ1KSIvPjxlbGxpcHNlIHJ5PSIxOS44OSIgcng9Ii45NzUiIGN5PSItLjAxOSIgY3g9IjY3LjA2OCIgdHJhbnNmb3JtPSJyb3RhdGUoNDUpIi8+PC9zdmc+"; // original: image/node_background_neuron.svg

const searchedforMuscleBackground =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyOSIgaGVpZ2h0PSIyOSIgdmlld0JveD0iMCAwIDI5IDI5Ij48ZyB0cmFuc2Zvcm09InJvdGF0ZSg0NSAxMjM1LjMwOCAtNTExLjY4KSI+PHBhdGggZD0iTTcyOC4yNCA3MTkuMDE4YS45NzcgMjAuNDgyIDAgMCAwLS43MjQgOC41bDEuNjM3IDEuNjM2YS45NzcgMjAuNDgyIDAgMCAwLS44NDQtMTAuMTg2Ljk3NyAyMC40ODIgMCAwIDAtLjA3LjA1ek03NDguNTgyIDcwNy41N2EuOTc3IDIwLjQ4MiAwIDAgMC0uMTQ3IDEwLjc3Ni45NzcgMjAuNDgyIDAgMCAwIC45NzcgMjAuNDgyLjk3NyAyMC40ODIgMCAwIDAgLjk3Ny0yMC40OC45NzcgMjAuNDgyIDAgMCAwLS4xMDMtOS4wNzJsLTEuNzA1LTEuNzA2ek03NTkuMTIgNzE4LjExYS45NzcgMjAuNDgyIDAgMCAwIC44NDMgMTAuMTY3Ljk3NyAyMC40ODIgMCAwIDAgLjc5My04LjUzMmwtMS42MzYtMS42MzZ6TTc1My43MTIgNzEyLjdhLjk3NyAyMC40ODIgMCAwIDAgMCAuMzcuOTc3IDIwLjQ4MiAwIDAgMCAuOTc1IDIwLjQ4My45NzcgMjAuNDgyIDAgMCAwIC45NzQtMTguOTAzbC0xLjk0OC0xLjk1ek03MzMuNTE1IDcxMy43NDJhLjk3NyAyMC40ODIgMCAwIDAtLjkwNCAxOC44N2wxLjk1IDEuOTVhLjk3NyAyMC40ODIgMCAwIDAgLjAwMi0uMzg4Ljk3NyAyMC40ODIgMCAwIDAtLjk3Ny0yMC40OC45NzcgMjAuNDgyIDAgMCAwLS4wNy4wNDh6TTczOC43OSA3MDguNDY3YS45NzcgMjAuNDgyIDAgMCAwLS45MDggMjAuNDMuOTc3IDIwLjQ4MiAwIDAgMCAuMTAzIDkuMDlsMS43MDQgMS43MDNhLjk3NyAyMC40ODIgMCAwIDAgLjE0OC0xMC43OTIuOTc3IDIwLjQ4MiAwIDAgMC0uOTc2LTIwLjQ4Mi45NzcgMjAuNDgyIDAgMCAwLS4wNy4wNXoiLz48ZWxsaXBzZSByeT0iMjAuNDgyIiByeD0iLjk3NyIgY3k9IjcyMy42MjIiIGN4PSI3NDQuMTM2Ii8+PC9nPjwvc3ZnPg=="; // original: image/node_background_muscle.svg

const SELECTED_NODE_STYLE = {
  "border-width": 2,
  "border-color": "black",
  "border-opacity": 1,
};

const SEARCHED_FOR_NODE_STYLE = {
  "background-image": searchedforNeuronBackground,
  "background-image-opacity": ".2",
  "z-index": 0,
  "background-repeat": "no-repeat",
  "background-height": 22,
  "background-width": 22,
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
      "arrow-scale": 0.6,
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
      "arrow-scale": 0.6,
    },
  },
];

const CHEMICAL_STYLE = [
  {
    selector: ".chemical",
    style: { "line-color": "#63625F", width: "data(width)" },
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
      width: "data(width)",
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
      "font-size": "8px",
      "font-weight": "bold",
      "text-background-opacity": 0,
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
      "text-background-opacity": 0,
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
    selector: "node.searchedfor",
    style: SEARCHED_FOR_NODE_STYLE,
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
  {
    selector: "node[?none], node[?muscle], node[?others]",
    css: {
      "font-size": 8,
      shape: "roundrectangle",
      width: "label",
      height: "10px",
      padding: "8px",
      "z-index": 10,
    },
  },
  {
    selector: "node.searchedfor[?none], node.searchedfor[?muscle], node.searchedfor[?others]",
    css: {
      "background-image": searchedforMuscleBackground,
      "background-repeat": "repeat-x",
      "background-image-opacity": "0.1",
    },
  },
];

const ANNOTATION_STYLES = Object.entries(annotationLegend).map(([, { id, color }]) => ({
  selector: `.${id}`,
  style: {
    "line-color": color,
    "target-arrow-color": color,
    "source-arrow-color": color,
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
