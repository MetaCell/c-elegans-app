import { Color } from "ol/color";
import type { FeatureLike } from "ol/Feature";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import Text from "ol/style/Text";

export function hexToRGBArray(hex: string): [number, number, number] {
  hex = hex.replace("#", "");
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);

  return [r, g, b];
}

export function activeNeuronStyle(feature: FeatureLike, color?: string): Style {
  const opacity = 0.2;
  const [r, g, b] = color ? hexToRGBArray(color) : feature.get("color");
  const rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;

  return new Style({
    stroke: new Stroke({
      color: [r, g, b],
      width: 2,
    }),
    fill: new Fill({
      color: rgbaColor,
    }),
  });
}

export function selectedNeuronStyle(feature: FeatureLike, color?: string): Style {
  const opacity = 0.5;
  const [r, g, b] = color ? hexToRGBArray(color) : feature.get("color");
  const rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;

  return new Style({
    stroke: new Stroke({
      color: [r, g, b],
      width: 4,
    }),
    fill: new Fill({
      color: rgbaColor,
    }),
    text: new Text({
      text: feature.get("name"),
      scale: 2,
    }),
  });
}

export function cellFeatureName(feature: FeatureLike): string {
  const neuronName = feature.getProperties()?.name;

  if (typeof neuronName !== "string") {
    throw Error("neuron segment doesn't have a valid name property");
  }

  return neuronName;
}

function synapseColor(feature: FeatureLike): Color {
  const neuronName = cellFeatureName(feature);
  const colorer = new String2HexCodeColor();
  return hexToRGBArray(colorer.stringToColor(neuronName));
}

export function activeSynapseStyle(feature: FeatureLike, color?: string): Style {
  const opacity = 0.2;
  const [r, g, b] = color ? hexToRGBArray(color) : synapseColor(feature);
  const rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;

  return new Style({
    stroke: new Stroke({
      color: [r, g, b],
      width: 2,
    }),
    fill: new Fill({
      color: rgbaColor,
    }),
  });
}

export function selectedSynapseStyle(feature: FeatureLike, color?: string): Style {
  const opacity = 0.5;
  const [r, g, b] = color ? hexToRGBArray(color) : synapseColor(feature);
  const rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;

  return new Style({
    stroke: new Stroke({
      color: [r, g, b],
      width: 4,
    }),
    fill: new Fill({
      color: rgbaColor,
    }),
    text: new Text({
      text: feature.get("name"),
      scale: 2,
    }),
  });
}

// from: github:HugoJBello/string-to-hex-code-color
class String2HexCodeColor {
  defaultShadePercentage = 0;

  constructor(defaultShadePercentage?: number) {
    if (defaultShadePercentage) this.defaultShadePercentage = defaultShadePercentage;
  }

  shadeColor(color: string, percent: number | undefined) {
    if (!percent) {
      percent = this.defaultShadePercentage;
    }
    const f = parseInt(color.slice(1), 16);
    const t = percent < 0 ? 0 : 255;
    const p = percent < 0 ? percent * -1 : percent;
    const R = f >> 16;
    const G = (f >> 8) & 0x00ff;
    const B = f & 0x0000ff;
    const result =
      "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
    return result;
  }

  stringToColor(str: string, shadePercentage?: number) {
    if (!str) str = "";
    if (str.length < 4) {
      str = str + this.preHash(str).toString();
    }

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      colour += ("00" + value.toString(16)).substr(-2);
    }
    if (shadePercentage || this.defaultShadePercentage !== 0) {
      return this.shadeColor(colour, shadePercentage);
    }
    return colour;
  }

  preHash(str: string) {
    {
      let hash = 0;
      if (str.length === 0) {
        return hash;
      }
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash;
    }
  }
}
