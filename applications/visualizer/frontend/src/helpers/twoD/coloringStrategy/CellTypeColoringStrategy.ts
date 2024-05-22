import {ColoringStrategy, ColorMap} from "./ColoringStrategy.ts";
import {Neuron} from "../../../rest";

export enum CellType {
    Neurosecretory = 'neurosecretory',
    Sensory = 'sensory',
    Inter = 'inter',
    Motor = 'motor',
    Muscle = 'muscle',
    Others = 'others'
}

const cellTypeColors: ColorMap = {
    [CellType.Neurosecretory]: '#F9D77B',
    [CellType.Sensory]: '#F9CEF9',
    [CellType.Inter]: '#FF887A',
    [CellType.Motor]: '#B7DAF5',
    [CellType.Muscle]: '#A8F5A2',
    [CellType.Others]: '#D9D9D9',
};

const cellTypeMap: { [key: string]: CellType } = {
    b: CellType.Muscle,
    u: CellType.Others,
    s: CellType.Sensory,
    i: CellType.Inter,
    m: CellType.Motor,
    n: CellType.Neurosecretory
};

export class CellTypeColoringStrategy implements ColoringStrategy {
    private static instance: CellTypeColoringStrategy;

    public static getInstance(): CellTypeColoringStrategy {
        if (!CellTypeColoringStrategy.instance) {
            CellTypeColoringStrategy.instance = new CellTypeColoringStrategy();
        }
        return CellTypeColoringStrategy.instance;
    }

    getColor(node: Neuron): string {
        const type = cellTypeMap[node.type];
        return cellTypeColors[type] || '#FFFFFF';
    }

    getColorMap(): ColorMap {
        return cellTypeColors
    }

}