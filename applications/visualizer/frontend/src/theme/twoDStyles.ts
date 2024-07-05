import {Stylesheet} from "cytoscape";

const NODE_STYLE = {
    'background-color': '#666',
    'label': 'data(label)',
    'color': '#fff',
    'text-valign': 'center',
    'text-halign': 'center',
    'font-size': '16px',
    width: '48px',
    height: '48px',
};

const EDGE_STYLE = {
    'line-color': '#ccc',
    'target-arrow-color': '#ccc',
    'target-arrow-shape': 'triangle',
    'curve-style': 'bezier',
    'arrow-scale': 0.3,
};

const CHEMICAL_STYLE = { 'line-color': '#63625F', 'width': 0.5 };
const ELECTRICAL_STYLE = { 'line-color': 'yellow', 'width': 0.5 };

export const GRAPH_STYLES = [
    {
        selector: 'node',
        style: NODE_STYLE
    },
    {
        selector: 'edge',
        style: EDGE_STYLE
    },
    {
        selector: '.chemical',
        style: CHEMICAL_STYLE
    },
    {
        selector: '.electrical',
        style: ELECTRICAL_STYLE
    }
] as Stylesheet[]