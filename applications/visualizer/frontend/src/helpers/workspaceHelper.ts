import {Dataset, DatasetsService} from "../rest";

export async function fetchDatasets(datasetIds: Set<string>): Promise<Record<string, Dataset>> {
    const datasetsPromise = Array?.from(datasetIds || [])?.map(datasetId =>
        DatasetsService.getDataset({dataset: datasetId})
    );

    const datasets = await Promise.all(datasetsPromise);

    return datasets.reduce((acc, dataset) => {
        acc[dataset.id] = dataset;
        return acc;
    }, {});
}