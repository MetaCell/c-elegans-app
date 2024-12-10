import { Box } from "@mui/material";
import "ol/ol.css";
import { type Feature, Map as OLMap, View } from "ol";
import type { FeatureLike } from "ol/Feature";
import ScaleLine from "ol/control/ScaleLine";
import type { Coordinate } from "ol/coordinate";
import { shiftKeyOnly } from "ol/events/condition";
import { getCenter } from "ol/extent";
import GeoJSON from "ol/format/GeoJSON";
import { MouseWheelZoom, defaults as defaultInteractions } from "ol/interaction.js";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { Projection } from "ol/proj";
import { XYZ } from "ol/source";
import VectorSource from "ol/source/Vector";
import { TileGrid } from "ol/tilegrid";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGlobalContext } from "../../../contexts/GlobalContext.tsx";
import { ViewerType, getEMDataURL, getSegmentationURL, getSynapsesSegmentationURL } from "../../../models/models.ts";
import type { Workspace } from "../../../models/workspace.ts";
import type { Dataset } from "../../../rest/index.ts";
import SceneControls from "./SceneControls.tsx";
import { activeNeuronStyle, cellFeatureName, selectedNeuronStyle, selectedSynapseStyle, activeSynapseStyle } from "./neuronsMapFeature.ts";
import { SlidingLayer } from "./slidingLayer.ts";
import Style from "ol/style/Style";

const newEMLayer = (dataset: Dataset, slice: number, tilegrid: TileGrid, projection: Projection): TileLayer<XYZ> => {
  return new TileLayer({
    source: new XYZ({
      tileGrid: tilegrid,
      url: getEMDataURL(dataset, slice),
      projection: projection,
      crossOrigin: "anonymous",
    }),
    zIndex: 0,
  });
};

const newSynapsesSegLayer = (dataset: Dataset, slice: number) => {
  return new VectorLayer({
    source: new VectorSource({
      url: getSynapsesSegmentationURL(dataset, slice),
      format: new GeoJSON(),
    }),
    zIndex: 1,
  });
};

const newSegLayer = (dataset: Dataset, slice: number) => {
  return new VectorLayer({
    source: new VectorSource({
      url: getSegmentationURL(dataset, slice),
      format: new GeoJSON(),
    }),
    zIndex: 2,
  });
};

function isNeuronActive(neuronId: string, workspace: Workspace): boolean {
  const emViewerVisibleNeurons = workspace.getVisibleNeuronsInEM();
  return emViewerVisibleNeurons.includes(neuronId) || emViewerVisibleNeurons.includes(workspace.getNeuronClass(neuronId));
}

function isCellSelected(cellId: string, workspace: Workspace): boolean {
  return workspace.getSelection(ViewerType.EM).includes(cellId);
}

function isNeuronVisible(neuronId: string, workspace: Workspace): boolean {
  return isNeuronActive(neuronId, workspace) || isCellSelected(neuronId, workspace);
}

function neuronColor(neuronId, workspace: Workspace): string {
  const neuronVisibilities = workspace.visibilities[neuronId] || workspace.visibilities[workspace.getNeuronClass(neuronId)];
  return neuronVisibilities?.[ViewerType.EM].color;
}

function neuronsStyle(feature: FeatureLike, workspace: Workspace) {
  const neuronName = cellFeatureName(feature);

  const color = neuronColor(neuronName, workspace);

  if (isCellSelected(neuronName, workspace)) {
    return selectedNeuronStyle(feature, color);
  }

  if (isNeuronActive(neuronName, workspace)) {
    return activeNeuronStyle(feature, color);
  }

  return null;
}

function synapsesStyle(feature: FeatureLike, workspace: Workspace): Style {
  const synapseName = cellFeatureName(feature);

  if (isCellSelected(synapseName, workspace)) {
    return selectedSynapseStyle(feature);
  }

  return activeSynapseStyle(feature);
}

// LayerSelect specified a layer for features to be selected from and an handler function to be called if features are found.
// The handler next function forces a jump to the next layer selector.
type LayerSelector = [VectorLayer<Feature> | undefined, (feature: Feature, next: () => void) => void];

function selectAcrossLayers(position: Coordinate, ...selectors: LayerSelector[]) {
  for (let i = 0; i < selectors.length; i++) {
    const [layer, handler] = selectors[i];
    const source = layer?.getSource();
    const features = source?.getFeaturesAtCoordinate(position);
    if (!features || features.length === 0) {
      continue;
    }

    if (features.length > 1) {
      console.warn("found overlapping neurons on the same layer");
    }

    let shouldContinue = false;
    const next = () => {
      shouldContinue = true;
    };

    handler(features[0], next);

    if (!shouldContinue) {
      return;
    }
  }
}

function onNeuronSelect(feature: Feature, workspace: Workspace) {
  const neuronName = cellFeatureName(feature);

  if (isCellSelected(neuronName, workspace)) {
    workspace.removeSelection(neuronName, ViewerType.EM);
    // Is there a neuron in the selection that comes from the same class. If not, we can remove the class from the selection
    const removeClass = !workspace
      .getSelection(ViewerType.ThreeD)
      .some((e) => workspace.getNeuronClass(e) !== e && workspace.getNeuronClass(e) === workspace.getNeuronClass(neuronName));
    if (removeClass) {
      workspace.removeSelection(workspace.getNeuronClass(neuronName), ViewerType.ThreeD);
    }
    return;
  }

  if (!isNeuronVisible(neuronName, workspace)) {
    return;
  }

  workspace.addSelection(neuronName, ViewerType.EM);
}

function onSynapseSelect(feature: Feature, workspace: Workspace) {
  const synapseName = cellFeatureName(feature);

  if (isCellSelected(synapseName, workspace)) {
    workspace.removeSelection(synapseName, ViewerType.EM);
    return;
  }

  workspace.addSelection(synapseName, ViewerType.EM);
}

const scale = new ScaleLine({
  units: "metric",
});

const interactions = defaultInteractions({
  mouseWheelZoom: false,
}).extend([
  new MouseWheelZoom({
    condition: shiftKeyOnly,
  }),
]);

const EMStackViewer = () => {
  const currentWorkspace = useGlobalContext().getCurrentWorkspace();

  // We take the first active dataset at the moment (will change later)
  const firstActiveDataset = Object.values(currentWorkspace.activeDatasets)?.[0];
  const [minSlice, maxSlice] = firstActiveDataset.emData.sliceRange;
  const startSlice = Math.floor((maxSlice + minSlice) / 2);
  const [segSlice, segSetSlice] = useState<number>(startSlice);
  const ringSize = 11;

  const mapRef = useRef<OLMap | null>(null);
  const currSegLayer = useRef<VectorLayer<Feature> | null>(null);
  const currSynSegLayer = useRef<VectorLayer<Feature> | null>(null);

  const ringEM = useRef<SlidingLayer<TileLayer<XYZ>>>();
  const ringSeg = useRef<SlidingLayer<VectorLayer<Feature>>>();
  const ringSynSeg = useRef<SlidingLayer<VectorLayer<Feature>>>();

  const [showNeurons, setShowNeurons] = useState<boolean>(true);
  const [showSynapses, setShowSynapses] = useState<boolean>(true);

  const startZoom = useMemo(() => {
    const emData = firstActiveDataset.emData;
    if (!emData) {
      return undefined;
    }
    return emData.minZoom;
  }, [firstActiveDataset.emData]);

  const extent = useMemo(() => [0, 0, ...firstActiveDataset.emData.segmentationSize], [firstActiveDataset.emData.segmentationSize]);

  const projection = useMemo(() => {
    return new Projection({
      code: "pixel",
      units: "pixels",
      extent: extent,
      metersPerUnit: 2e-9, // 2 nm voxels
    });
  }, [extent]);

  const tilegrid = useMemo(() => {
    return new TileGrid({
      minZoom: 1, // tiles for zoom 0 not available in the dataset
      extent: extent,
      tileSize: firstActiveDataset.emData.tileSize[0],
      resolutions: [0.5, 1, 2, 4, 8, 16, 32].reverse(),
    });
  }, [extent, firstActiveDataset.emData.tileSize]);

  // const debugLayer = new TileLayer({
  // 	source: new TileDebug({
  // 		projection: projection,
  // 		tileGrid: tilegrid,
  // 	}),
  // });

  const makeFeatureClickHandler = () => (position) =>
    selectAcrossLayers(
      position,
      [
        currSegLayer.current,
        (feature, next) => {
          if (!isNeuronVisible(cellFeatureName(feature), currentWorkspace)) {
            return next();
          }
          onNeuronSelect(feature, currentWorkspace);
        },
      ],
      [currSynSegLayer.current, (feature) => onSynapseSelect(feature, currentWorkspace)],
    );

  const neuronsStyleRef = useRef((feature) => neuronsStyle(feature, currentWorkspace));
  const synapsesStyleRef = useRef((feature) => synapsesStyle(feature, currentWorkspace));
  const onFeatureClickRef = useRef(makeFeatureClickHandler());

  useEffect(() => {
    if (!currSegLayer.current?.getSource()) {
      return;
    }

    neuronsStyleRef.current = (feature: Feature) => neuronsStyle(feature, currentWorkspace);
    onFeatureClickRef.current = makeFeatureClickHandler();
    currSegLayer.current.getSource().changed();
  }, [currentWorkspace.getVisibleNeuronsInEM(), currentWorkspace.visibilities, currentWorkspace.getSelection(ViewerType.EM), segSlice]);

  useEffect(() => {
    if (!currSynSegLayer.current?.getSource()) {
      return;
    }

    synapsesStyleRef.current = (feature: Feature) => synapsesStyle(feature, currentWorkspace);
    onFeatureClickRef.current = makeFeatureClickHandler();
    currSynSegLayer.current.getSource().changed();
  }, [currentWorkspace.getSelection(ViewerType.EM), segSlice]);

  useEffect(() => {
    if (!ringSeg.current) {
      return;
    }
    showNeurons ? ringSeg.current.enable() : ringSeg.current.disable();
  }, [showNeurons]);

  useEffect(() => {
    if (!ringSynSeg.current) {
      return;
    }
    showSynapses ? ringSynSeg.current.enable() : ringSynSeg.current.disable();
  }, [showSynapses]);

  useEffect(() => {
    if (mapRef.current) {
      return;
    }

    const map = new OLMap({
      target: "emviewer",
      layers: [],
      view: new View({
        projection: projection,
        center: getCenter(extent),
        extent: extent,
        resolutions: tilegrid.getResolutions(), // forces view zoom options
      }),
      controls: [scale],
      interactions: interactions,
    });

    ringEM.current = new SlidingLayer({
      map: map,
      cacheSize: ringSize,
      startAt: startSlice,
      extent: [minSlice, maxSlice],
      newLayer: (slice) => newEMLayer(firstActiveDataset, slice, tilegrid, projection),
    });

    ringSeg.current = new SlidingLayer({
      map: map,
      cacheSize: ringSize,
      startAt: startSlice,
      extent: [minSlice, maxSlice],
      newLayer: (slice) => newSegLayer(firstActiveDataset, slice),
      onSlide: (slice, layer) => {
        layer.setStyle((feature) => neuronsStyleRef.current(feature));
        currSegLayer.current = layer;
        segSetSlice(slice);
      },
    });

    map.on("click", (e) => onFeatureClickRef.current(e.coordinate));

    ringSynSeg.current = new SlidingLayer({
      map: map,
      cacheSize: ringSize,
      startAt: startSlice,
      extent: [minSlice, maxSlice],
      newLayer: (slice) => newSynapsesSegLayer(firstActiveDataset, slice),
      onSlide: (_, layer) => {
        layer.setStyle((feature) => synapsesStyleRef.current(feature));
        currSynSegLayer.current = layer;
      },
    });

    newSynapsesSegLayer;

    function handleSliceScroll(e: WheelEvent) {
      const scrollUp = e.deltaY < 0;

      if (scrollUp) {
        ringEM.current.next();
        ringSeg.current.next();
        ringSynSeg.current.next();
      } else {
        ringEM.current.prev();
        ringSeg.current.prev();
        ringSynSeg.current.prev();
      }
    }

    function handleZoomScroll(e: WheelEvent) {
      const scrollUp = e.deltaY < 0;

      const view = map.getView();
      const zoom = view.getZoom();

      if (scrollUp) {
        view.setZoom(view.getConstrainedZoom(zoom + 1, 1));
      } else {
        view.setZoom(view.getConstrainedZoom(zoom - 1, -1));
      }
    }

    map.getTargetElement().addEventListener("wheel", (e) => {
      e.preventDefault();
      if (e.shiftKey) {
        handleZoomScroll(e);
        return;
      }
      handleSliceScroll(e);
    });

    // set map zoom to the minimum zoom possible
    // const minZoomAvailable = tilegrid.getMinZoom();
    map.getView().setZoom(startZoom);

    mapRef.current = map;

    return () => map.setTarget(null);
  }, []);

  const onControlZoomIn = () => {
    if (!mapRef.current) return;
    const view = mapRef.current.getView();
    const targetZoom = view.getZoom() + 1;
    view.setZoom(view.getConstrainedZoom(targetZoom, 1));
  };

  const onControlZoomOut = () => {
    if (!mapRef.current) return;
    const view = mapRef.current.getView();
    const targetZoom = view.getZoom() - 1;
    view.setZoom(view.getConstrainedZoom(targetZoom, -1));
  };

  const onResetView = () => {
    // reset sliding window
    ringEM.current.goto(startSlice);
    ringSeg.current.goto(startSlice);
    ringSynSeg.current.goto(startSlice);

    if (!mapRef.current) return;
    const view = mapRef.current.getView();

    const center = getCenter(extent);
    view.setCenter(center);

    const minZoomAvailable = view.getMinZoom();
    view.setZoom(minZoomAvailable);
  };

  const onPrint = () => {
    if (!mapRef.current) return;
    mapRef.current.once("rendercomplete", () => {
      printEMView(mapRef.current);
    });
    mapRef.current.renderSync();
  };

  return (
    <Box sx={{ position: "relative", display: "flex", width: "100%", height: "100%" }}>
      <SceneControls
        onZoomIn={onControlZoomIn}
        onResetView={onResetView}
        onZoomOut={onControlZoomOut}
        onPrint={onPrint}
        layers={{
          neurons: {
            label: "Neurons",
            checked: showNeurons,
            onToggle: setShowNeurons,
          },
          synapses: {
            label: "Synapses",
            checked: showSynapses,
            onToggle: setShowSynapses,
          },
        }}
      />
      <div id="emviewer" style={{ height: "100%", width: "100%" }} />
    </Box>
  );
};

export default EMStackViewer;

export function printEMView(map: OLMap) {
  const mapCanvas = document.createElement("canvas");

  const size = map.getSize();
  mapCanvas.width = size[0];
  mapCanvas.height = size[1];

  const mapContext = mapCanvas.getContext("2d");

  Array.prototype.forEach.call(map.getViewport().querySelectorAll(".ol-layer canvas, canvas.ol-layer"), (canvas) => {
    if (canvas.width > 0) {
      const opacity = canvas.parentNode.style.opacity || canvas.style.opacity;
      mapContext.globalAlpha = opacity === "" ? 1 : Number(opacity);
      let matrix: Array<number>;
      const transform = canvas.style.transform;
      if (transform) {
        // Get the transform parameters from the style's transform matrix
        matrix = transform
          .match(/^matrix\(([^\(]*)\)$/)[1]
          .split(",")
          .map(Number);
      } else {
        matrix = [Number.parseFloat(canvas.style.width) / canvas.width, 0, 0, Number.parseFloat(canvas.style.height) / canvas.height, 0, 0];
      }
      // Apply the transform to the export map context
      CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, matrix);
      const backgroundColor = canvas.parentNode.style.backgroundColor;
      if (backgroundColor) {
        mapContext.fillStyle = backgroundColor;
        mapContext.fillRect(0, 0, canvas.width, canvas.height);
      }
      mapContext.drawImage(canvas, 0, 0);
    }
  });

  mapContext.globalAlpha = 1;
  mapContext.setTransform(1, 0, 0, 1, 0, 0);

  const link = document.createElement("a");
  link.href = mapCanvas.toDataURL();
  link.download = "em.png"; // TODO: define a better name
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
