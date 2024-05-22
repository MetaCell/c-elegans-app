import {Neuron} from "../../../rest";
import {NeurotransmitterColoringStrategy} from "./NeurotransmiterColoringStrategy.ts";
import {CellTypeColoringStrategy} from "./CellTypeColoringStrategy.ts";


export interface ColorMap {
    [key: string]: string;
}

export interface ColoringStrategy {
    getColor(node: Neuron): string;

    getColorMap(): ColorMap
}

export enum ColoringOptions {
    CELL_TYPE = 'Cell type',
    NEUROTRANSMITTER = 'Neurotransmitter',
}

export const getColoringStrategy = (option: ColoringOptions) => {
    if (option === ColoringOptions.CELL_TYPE) {
        return CellTypeColoringStrategy.getInstance();
    } else if (option === ColoringOptions.NEUROTRANSMITTER) {
        return NeurotransmitterColoringStrategy.getInstance();
    }
}