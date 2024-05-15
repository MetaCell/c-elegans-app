import {Dataset, DatasetsService, Neuron} from "../rest";

export async function fetchDatasets(datasetIds: string[]): Promise<Record<string, Dataset>> {
    const datasetsPromise = datasetIds.map(datasetId =>
        DatasetsService.getDataset({dataset: datasetId})
    );
    const datasets = await Promise.all(datasetsPromise);
    return datasets.reduce((acc, dataset) => {
        acc[dataset.id] = dataset;
        return acc;
    }, {});
}

export async function fetchAndFilterNeurons(datasetIds: string[], neuronIds: string[]): Promise<Record<string, Neuron>> {
    const neuronPromises = datasetIds.map(datasetId =>
        DatasetsService.getDatasetNeurons({dataset: datasetId})
    );
    const neuronsArrays = await Promise.all(neuronPromises);
    const allNeurons = neuronsArrays.flat();
    return allNeurons.reduce((acc, neuron) => {
        if (neuronIds.includes(neuron.name)) {
            acc[neuron.name] = neuron;
        }
        return acc;
    }, {});
}