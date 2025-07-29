/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GroupedSynapse } from '../models/GroupedSynapse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SynapsesService {
    /**
     * Get Dataset Synapses
     * @returns GroupedSynapse OK
     * @throws ApiError
     */
    public static getDatasetSynapses({
        datasetIds,
        neurons,
    }: {
        datasetIds?: Array<string>,
        neurons?: Array<string>,
    }): CancelablePromise<GroupedSynapse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/synapses',
            query: {
                'datasetIds': datasetIds,
                'neurons': neurons,
            },
        });
    }
}
