import type { Dataset } from "../rest";

export const getWorkspaceActiveDatasets = (datasets: Record<string, Dataset>, datasetIds: Set<string>): Record<string, Dataset> => {
  const datasetsArray = Object.values(datasets).filter((dataset) => datasetIds.has(dataset.id));
  return datasetsArray.reduce(
    (acc, dataset) => {
      acc[dataset.id] = dataset;
      return acc;
    },
    {} as Record<string, Dataset>,
  );
};
