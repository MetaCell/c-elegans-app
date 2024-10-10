/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EMData } from './EMData';
export type Dataset = {
    id: string;
    neuron3DUrl: string;
    emData: (EMData | null);
    collection: string;
    name: string;
    description: string;
    time: number;
    visualTime: number;
    type: string;
    axes?: (Record<string, any> | null);
};

