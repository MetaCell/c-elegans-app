import {ColoringStrategy, ColorMap} from "./ColoringStrategy.ts";
import {Neuron} from "../../../rest";

export enum NeurotransmitterType {
    Acetylcholine = 'acetylcholine',
    Dopamine = 'dopamine',
    GABA = 'gaba',
    Glutamate = 'glutamate',
    Octopamine = 'octopamine',
    Serotonin = 'serotonin',
    Tyramine = 'tyramine',
    Unknown = 'unknown',
    None = 'none',
}

const neurotransmitterColors: ColorMap = {
    [NeurotransmitterType.Acetylcholine]: '#FF887A',
    [NeurotransmitterType.Dopamine]: '#A8F5A2',
    [NeurotransmitterType.GABA]: '#99CCFF',
    [NeurotransmitterType.Glutamate]: '#FFF860',
    [NeurotransmitterType.Octopamine]: '#CFACFF',
    [NeurotransmitterType.Serotonin]: '#90FFCF',
    [NeurotransmitterType.Tyramine]: '#F9D77B',
    [NeurotransmitterType.Unknown]: '#D9D9D9',
    [NeurotransmitterType.None]: '#FFFFFF',
};

const neurotransmitterTypeMap: { [key: string]: NeurotransmitterType } = {
    a: NeurotransmitterType.Acetylcholine,
    d: NeurotransmitterType.Dopamine,
    g: NeurotransmitterType.GABA,
    l: NeurotransmitterType.Glutamate,
    o: NeurotransmitterType.Octopamine,
    s: NeurotransmitterType.Serotonin,
    t: NeurotransmitterType.Tyramine,
    u: NeurotransmitterType.Unknown,
    n: NeurotransmitterType.None
};

export class NeurotransmitterColoringStrategy implements ColoringStrategy {
    private static instance: NeurotransmitterColoringStrategy;

    public static getInstance(): NeurotransmitterColoringStrategy {
        if (!NeurotransmitterColoringStrategy.instance) {
            NeurotransmitterColoringStrategy.instance = new NeurotransmitterColoringStrategy();
        }
        return NeurotransmitterColoringStrategy.instance;
    }

    getColors(node: Neuron): string[] {
        return node.neurotransmitter.split('').map(ntChar => {
            const nt = neurotransmitterTypeMap[ntChar];
            return neurotransmitterColors[nt] || '#FFFFFF';
        });
    }

    getColorMap(): ColorMap {
        return neurotransmitterColors
    }

}