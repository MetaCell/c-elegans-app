export enum ViewMode {
    Default = 'Default',
    Compare = 'Compare',
}

export enum ViewerType {
    Graph = 'Graph',
    ThreeD = '3D',
    EM = 'EM',
    InstanceDetails = 'Instance Details'
}

export enum ViewerSynchronizationPair {
    Graph_InstanceDetails,
    Graph_ThreeD,
    ThreeD_EM
}

export interface NeuronGroup {
    id: string;
    name: string;
    color: string;
    neurons: Set<string>;
}


export interface Dataset {
    name: string;
    // Add other properties as needed
}

export interface Neuron {
    name: string;
    // Add other properties as needed
}