/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Connection } from '../models/Connection';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ConnectivityService {
    /**
     * Get Connections
     * Gets the connections of a dedicated Dataset
     * @returns Connection OK
     * @throws ApiError
     */
    public static getConnections({
        cells,
        datasetIds,
        datasetType,
        thresholdChemical = 3,
        thresholdElectrical = 3,
        includeNeighboringCells = false,
        includeAnnotations = false,
    }: {
        cells: string,
        datasetIds: string,
        datasetType: string,
        thresholdChemical?: number,
        thresholdElectrical?: number,
        includeNeighboringCells?: boolean,
        includeAnnotations?: boolean,
    }): CancelablePromise<Array<Connection>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/connections',
            query: {
                'cells': cells,
                'dataset_ids': datasetIds,
                'dataset_type': datasetType,
                'threshold_chemical': thresholdChemical,
                'threshold_electrical': thresholdElectrical,
                'include_neighboring_cells': includeNeighboringCells,
                'include_annotations': includeAnnotations,
            },
        });
    }
}
