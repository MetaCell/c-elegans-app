/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HeathcheckService {
    /**
     * Live
     * Test if application is healthy
     * @returns any OK
     * @throws ApiError
     */
    public static live(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/live',
        });
    }
    /**
     * Ping
     * test the application is up
     * @returns any OK
     * @throws ApiError
     */
    public static ping(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/ping',
        });
    }
    /**
     * Ready
     * Test if application is ready to take requests
     * @returns any OK
     * @throws ApiError
     */
    public static ready(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/ready',
        });
    }
}
