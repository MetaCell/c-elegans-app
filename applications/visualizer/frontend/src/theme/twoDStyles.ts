import type {Stylesheet} from "cytoscape";

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

const EDGE_STYLE = {
    "line-color": "#63625F",
    "target-arrow-color": "#63625F",
    "target-arrow-shape": "triangle",
    "curve-style": "bezier",
    "arrow-scale": 0.3,
};

const CHEMICAL_STYLE = {"line-color": "#63625F", width: 0.5};
const ELECTRICAL_STYLE = {"line-color": "yellow", width: 0.5};

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
        selector: 'edge.hover, edge.showEdgeLabel',
        style: {
            'label': 'data(label)',
            'font-size': '8px',
        },
    },
    {
        selector: 'edge.focus',
        style: {
            'label': 'data(longLabel)',
            'font-size': '8px',
            'text-wrap': 'wrap'

        },
    }
];

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
] as Stylesheet[];


