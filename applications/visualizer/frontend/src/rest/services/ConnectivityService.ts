/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Connection } from '../models/Connection';
import type { RawConnection } from '../models/RawConnection';
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
    /**
     * Get Dataset Connectivity
     * Download the connections of a dedicated Dataset in either CSV or JSON format (default CSV).
     * @returns any OK
     * @throws ApiError
     */
    public static getDatasetConnectivity({
        datasetId,
        format = 'csv',
    }: {
        datasetId: string,
        format?: 'csv' | 'json',
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/connections/{datasetId}/download',
            path: {
                'datasetId': datasetId,
            },
            query: {
                'format': format,
            },
        });
    }
    /**
     * Get Dataset Connections
     * Gets the connections of a dedicated Dataset
     * Connections includes connection towards the neurons and their classes by default.
     * if exclude_class is set to true: the neuron classes (higher level neuron) is not included.
     * @returns RawConnection OK
     * @throws ApiError
     */
    public static getDatasetConnections({
        datasetId,
        excludeClass = false,
    }: {
        datasetId: string,
        excludeClass?: boolean,
    }): CancelablePromise<Array<RawConnection>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/connections/{datasetId}',
            path: {
                'datasetId': datasetId,
            },
            query: {
                'exclude_class': excludeClass,
            },
        });
    }
}
