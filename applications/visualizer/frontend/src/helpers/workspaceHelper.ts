import {Dataset, DatasetsService} from "../rest";

export async function fetchDatasets(datasetIds: Set<string>): Promise<Record<string, Dataset>> {
    const datasetIdsArray = Array.from(datasetIds || []);
    const datasets = await DatasetsService.getDatasets({
        ids: datasetIdsArray.length > 0 ? datasetIdsArray : undefined,
    });

    return datasets.reduce((acc, dataset) => {
        acc[dataset.id] = dataset;
        return acc;
    }, {});
}