import {createStore} from "@reduxjs/toolkit";

export enum ViewerType {
    Graph = 'Graph',
    ThreeD = '3D',
    EM = 'EM',
    InstanceDetails = 'Instance Details'
}

type ViewerSynchronizationPair =
    [ViewerType.Graph | ViewerType.InstanceDetails]
    | [ViewerType.Graph, ViewerType.ThreeD]
    | [ViewerType.ThreeD, ViewerType.EM];


export interface Workspace {
    id: string;
    name: string;
    viewers: Viewer[];
    datasets: Dataset[];
    neurons: Neuron[];
    synchronizations: ViewerSynchronization[];

    store: ReturnType<typeof createStore>;
    layoutManager: unknown;
}

interface Viewer {
    type: ViewerType;
    isVisible: boolean;
}

interface Dataset {
    id: string;
    name: string;
    neurons: Neuron[];
}

interface Neuron {
    id: string;
    label: string;
    isSelected: boolean;
    groupId?: string;
}

export interface NeuronGroup {
    id: string;
    name: string;
    color: string;
}

interface ViewerSynchronization {
    pair: ViewerSynchronizationPair;
    isActive: boolean;
}