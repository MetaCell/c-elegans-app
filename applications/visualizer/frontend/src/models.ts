import {createStore} from "@reduxjs/toolkit";

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

export interface Workspace {
    id: string;
    name: string;
    viewers: Record<ViewerType, boolean>;
    datasets: Set<string>;
    neurons: Set<string>;
    synchronizations: Record<ViewerSynchronizationPair, boolean>;
    neuronGroups: Record<string, NeuronGroup>;

    store: ReturnType<typeof createStore>;
    layoutManager: unknown;
}

export interface Dataset {
    id: string;
    name: string;
    neurons: Set<Neuron>;
}

export interface Neuron {
    id: string;
    name: string;
}

export interface NeuronGroup {
    id: string;
    name: string;
    color: string;
    neurons: Set<string>;
}
