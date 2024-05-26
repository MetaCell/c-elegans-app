import {Stylesheet} from "cytoscape";

const NODE_STYLE = {
    'background-color': '#666',
    'label': 'data(label)',
    'color': '#fff',
    'text-outline-color': '#000',
    'text-outline-width': 2,
    'text-valign': 'center',
    'text-halign': 'center',
}

const EDGE_STYLE = {
    'width': 3,
    'line-color': '#ccc',
    'target-arrow-color': '#ccc',
    'target-arrow-shape': 'triangle',
    'curve-style': 'bezier'
}

const CHEMICAL_STYLE = {'line-color': 'blue'}
const ELECTRICAL_STYLE = {'line-color': 'yellow'}

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