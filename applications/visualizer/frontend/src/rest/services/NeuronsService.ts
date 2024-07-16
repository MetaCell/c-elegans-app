/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { PagedNeuron } from '../models/PagedNeuron';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NeuronsService {
    /**
     * Get All Cells
     * Returns all the cells (neurons) from the DB
     * @returns PagedNeuron OK
     * @throws ApiError
     */
    public static getAllCells({
        page = 1,
    }: {
        page?: number,
    }): CancelablePromise<PagedNeuron> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cells',
            query: {
                'page': page,
            },
        });
    }
}
