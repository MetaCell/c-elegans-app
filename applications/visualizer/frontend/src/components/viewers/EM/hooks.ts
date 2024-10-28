import VectorLayer from "ol/layer/Vector";
import Feature from "ol/Feature";
import { useGlobalContext } from "../../../contexts/GlobalContext";
import { ViewerType } from "../../../models";
import { useCallback, useEffect } from "react";
import { isNeuronVisible, neuronFeatureName } from "./neuronsMapFeature";
import { Geometry } from "ol/geom";

export function useSelectNeuron(layer: React.RefObject<VectorLayer<Feature> | null>) {
  const workspace = useGlobalContext().getCurrentWorkspace();

  useEffect(() => {
    if (!layer.current) {
      return;
    }

    // TODO: this can be optimized
    layer.current.getSource().forEachFeature((feature) => {
      const neuronName = neuronFeatureName(feature);
      const selectedNeurons = workspace.getViewerSelectedNeurons(ViewerType.EM);
      const includesNeuron = selectedNeurons.includes(neuronName);
      feature.setProperties({
        selected: includesNeuron,
      });
    });
  }, [workspace]);

  const selectNeuron = useCallback(
    (feature: Feature<Geometry>) => {
      const neuronName = neuronFeatureName(feature);

      // should not be able to click on hidden neurons
      if (!isNeuronVisible(feature)) return;

      const selectedNeurons = workspace.getViewerSelectedNeurons(ViewerType.EM);
      const isSelected = selectedNeurons.includes(neuronName);

      if (isSelected) {
        workspace.removeSelection(neuronName, ViewerType.EM);
        return;
      }

      workspace.addSelection(neuronName, ViewerType.EM);
    },
    [workspace],
  );

  return selectNeuron;
}
