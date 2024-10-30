import Feature, { FeatureLike } from "ol/Feature";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import Text from "ol/style/Text";

export function isNeuronVisible(feature: Feature) {
  return feature.get("selected") || feature.get("active");
}

export function neuronsStyle(feature: FeatureLike) {
  if (feature.get("selected")) {
    return selectedNeuronStyle(feature);
  }

  if (feature.get("active")) {
    return activeNeuronStyle(feature);
  }

  return null;
}

export function hexToRGBArray(hex: string): [number, number, number] {
  hex = hex.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return [r, g, b];
}

export function activeNeuronStyle(feature: FeatureLike): Style {
  const opacity = 0.2;
  const [r, g, b] = feature.get("color");
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

export function selectedNeuronStyle(feature: FeatureLike): Style {
  const opacity = 0.5;
  const [r, g, b] = feature.get("color");
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

export function neuronFeatureName(feature: FeatureLike): string {
  const properties = feature.getProperties();
  if (!properties.hasOwnProperty("name")) {
    throw Error("neuron segment doesn't have a name property");
  }

  const neuronName = properties["name"];
  if (typeof neuronName !== "string") {
    throw Error("neuron segment name is not a string");
  }

  return neuronName;
}
