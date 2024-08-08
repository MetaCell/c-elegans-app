/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Dataset } from '../models/Dataset';
import type { Neuron } from '../models/Neuron';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DatasetsService {
    /**
     * Get Datasets
     * Returns all datasets or a filtered list based on provided IDs
     * @returns Dataset OK
     * @throws ApiError
     */
    public static getDatasets({
        ids,
    }: {
        ids?: (Array<string> | null),
    }): CancelablePromise<Array<Dataset>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/datasets',
            query: {
                'ids': ids,
            },
        });
    }
    /**
     * Get Dataset
     * Returns a specific dataset
     * @returns Dataset OK
     * @throws ApiError
     */
    public static getDataset({
        dataset,
    }: {
        dataset: string,
    }): CancelablePromise<Dataset> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/datasets/{dataset}',
            path: {
                'dataset': dataset,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * Get Dataset Neurons
     * Returns all the neurons of a dedicated dataset
     * @returns Neuron OK
     * @throws ApiError
     */
    public static getDatasetNeurons({
        dataset,
    }: {
        dataset: string,
    }): CancelablePromise<Array<Neuron>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/datasets/{dataset}/neurons',
            path: {
                'dataset': dataset,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
}
