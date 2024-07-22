/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Neuron } from '../models/Neuron';
import type { PagedNeuron } from '../models/PagedNeuron';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NeuronsService {
    /**
     * Search Cells
     * @returns Neuron OK
     * @throws ApiError
     */
    public static searchCells({
        name,
        datasetIds,
    }: {
        name?: (string | null),
        datasetIds?: (Array<string> | null),
    }): CancelablePromise<Array<Neuron>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cells/search',
            query: {
                'name': name,
                'dataset_ids': datasetIds,
            },
        });
    }
    /**
     * Get All Cells
     * Returns all the cells (neurons) from the DB
     * @returns PagedNeuron OK
     * @throws ApiError
     */
    public static getAllCells({
        datasetIds,
        page = 1,
    }: {
        datasetIds?: (Array<string> | null),
        page?: number,
    }): CancelablePromise<PagedNeuron> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cells',
            query: {
                'dataset_ids': datasetIds,
                'page': page,
            },
        });
    }
}
