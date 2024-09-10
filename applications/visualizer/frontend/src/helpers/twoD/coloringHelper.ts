import type { Neuron } from "../../rest";

export enum ColoringOptions {
  CELL_TYPE = "Cell type",
  NEUROTRANSMITTER = "Neurotransmitter",
}

enum CellType {
  Neurosecretory = "neurosecretory",
  Sensory = "sensory",
  Inter = "inter",
  Motor = "motor",
  Muscle = "muscle",
  Others = "others",
}

interface CellDesign {
  type: CellType;
  color: string;
}

export const cellConfig: { [key: string]: CellDesign } = {
  s: { type: CellType.Sensory, color: "#F9CEF9" },
  i: { type: CellType.Inter, color: "#FF887A" },
  m: { type: CellType.Motor, color: "#B7DAF5" },
  n: { type: CellType.Neurosecretory, color: "#F9D77B" },
  b: { type: CellType.Muscle, color: "#A8F5A2" },
  u: { type: CellType.Others, color: "#D9D9D9" },
};

enum NeurotransmitterType {
  Acetylcholine = "acetylcholine",
  Dopamine = "dopamine",
  GABA = "gaba",
  Glutamate = "glutamate",
  Octopamine = "octopamine",
  Serotonin = "serotonin",
  Tyramine = "tyramine",
  Unknown = "unknown",
  None = "none",
}

interface NeurotransmitterDesign {
  type: NeurotransmitterType;
  color: string;
}

export const neurotransmitterConfig: { [key: string]: NeurotransmitterDesign } = {
  a: { type: NeurotransmitterType.Acetylcholine, color: "#FF887A" },
  d: { type: NeurotransmitterType.Dopamine, color: "#A8F5A2" },
  g: { type: NeurotransmitterType.GABA, color: "#99CCFF" },
  l: { type: NeurotransmitterType.Glutamate, color: "#FFF860" },
  o: { type: NeurotransmitterType.Octopamine, color: "#CFACFF" },
  s: { type: NeurotransmitterType.Serotonin, color: "#90FFCF" },
  t: { type: NeurotransmitterType.Tyramine, color: "#F9D77B" },
  u: { type: NeurotransmitterType.Unknown, color: "#D9D9D9" },
  n: { type: NeurotransmitterType.None, color: "#FFFFFF" },
};

type Config = { [key: string]: { type: string; color: string } };

const colorConfigMap: { [key in ColoringOptions]: Config } = {
  [ColoringOptions.CELL_TYPE]: cellConfig,
  [ColoringOptions.NEUROTRANSMITTER]: neurotransmitterConfig,
};

export const getColor = (node: Neuron, option: ColoringOptions): string[] => {
  const config = colorConfigMap[option];
  const chars = option === ColoringOptions.CELL_TYPE ? node.type : node.neurotransmitter;
  return extractColors(config, chars);
};

export const getColorMap = (option: ColoringOptions): { [key: string]: string } => {
  const config = colorConfigMap[option];
  return Object.fromEntries(Object.entries(config).map(([, value]) => [value.type, value.color]));
};

const extractColors = (config: Config, chars: string): string[] => {
  return chars.split("").map((char) => config[char]?.color || "#FFFFFF");
};

export const legendNodeNameMapping: Record<string, string> = {
  [CellType.Neurosecretory]: "Modulatory",
  [CellType.Sensory]: "Sensory neuron",
  [CellType.Inter]: "Interneuron",
  [CellType.Motor]: "Motor neuron",
  [CellType.Muscle]: "Muscle",
  [CellType.Others]: "Other",
  [NeurotransmitterType.Acetylcholine]: "Acetylcholine",
  [NeurotransmitterType.Dopamine]: "Dopamine",
  [NeurotransmitterType.GABA]: "GABA",
  [NeurotransmitterType.Glutamate]: "Glutamate",
  [NeurotransmitterType.Octopamine]: "Octopamine",
  [NeurotransmitterType.Serotonin]: "Serotonin",
  [NeurotransmitterType.Tyramine]: "Tyramine",
  [NeurotransmitterType.Unknown]: "Unknown",
  [NeurotransmitterType.None]: "Non-neuronal",
};
