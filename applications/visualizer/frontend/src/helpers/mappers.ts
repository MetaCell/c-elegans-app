import {Dataset as DatasetApi, Neuron as NeuronApi} from "../rest";
import {Dataset, Neuron} from "../models.ts";

// Function to map Neuron from the request to the context format
export function mapNeuronFromRequestToContext(neuron: NeuronApi): Neuron {
    return {
        id: neuron.name || neuron.nclass,
        name: `${neuron.name}`
    };
}

export function mapDatasetFromRequestToContext(dataset: DatasetApi): Dataset {
    return {
        id: dataset.id || dataset.name,
        name: dataset.name,
        neurons: new Set<Neuron>()  // TODO: Need to understand how to populate this
    };
}