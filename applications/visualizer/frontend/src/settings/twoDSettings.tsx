import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';

export const CHEMICAL_THRESHOLD = 3
export const ELECTRICAL_THRESHOLD = 2

export const INCLUDE_NEIGHBORING_CELLS = false
export const INCLUDE_ANNOTATIONS = true

export const ZOOM_DELTA = 0.1

export enum GRAPH_LAYOUTS {
    Force = 'fcose',
    Hierarchical = 'dagre',
    Concentric = 'concentric'
}


export enum GraphType {
    Node,
    Connection
}

export const connectionsLegend = {
    chemical: {
        icon: <ArrowRightAltIcon/>,
        name: "Chemical Synapse"
    },
    electrical: {
        icon: <ElectricBoltIcon/>,
        name: "Gap Junction"
    },
};