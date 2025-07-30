import { Box, Typography } from "@mui/material";
import "ol/ol.css";
import { type Feature, Map as OLMap, View } from "ol";
import ScaleLine from "ol/control/ScaleLine";
import type { Coordinate } from "ol/coordinate";
import { shiftKeyOnly } from "ol/events/condition";
import { getCenter } from "ol/extent";
import type { FeatureLike } from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import { defaults as defaultInteractions, MouseWheelZoom } from "ol/interaction.js";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { Projection } from "ol/proj";
import { XYZ } from "ol/source";
import VectorSource from "ol/source/Vector";
import type Style from "ol/style/Style";
import { TileGrid } from "ol/tilegrid";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGlobalContext } from "../../../contexts/GlobalContext.tsx";
import { getEMDataURL, getEMResolution, getSegmentationURL, getSynapsesSegmentationURL, ViewerType } from "../../../models/models.ts";
import type { Workspace } from "../../../models/workspace.ts";
import type { Dataset } from "../../../rest/index.ts";
import { activeNeuronStyle, activeSynapseStyle, cellFeatureName, selectedNeuronStyle, selectedSynapseStyle } from "./neuronsMapFeature.ts";
import SceneControls from "./SceneControls.tsx";
import { SlidingLayer } from "./slidingLayer.ts";

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
  const neuronVisibilities = workspace.getNeuronVisibility(neuronId) || workspace.getNeuronVisibility(workspace.getNeuronClass(neuronId));
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

// LayerSelect specifies a layer for features to be selected from and a handler function to be called if a feature are found.
// The handler next function forces a jump to the next layer selector.
type LayerSelector = [VectorLayer<Feature> | undefined, (feature: Feature, next: () => void) => void];

function selectAcrossLayers(position: Coordinate, ...selectors: LayerSelector[]) {
  for (const [layer, handler] of selectors) {
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

  let wspace = workspace;
  if (isCellSelected(neuronName, workspace)) {
    wspace = wspace.removeSelection(neuronName, ViewerType.EM);
    // Is there a neuron in the selection that comes from the same class. If not, we can remove the class from the selection
    const removeClass = !workspace
      .getSelection(ViewerType.ThreeD)
      .some((e) => workspace.getNeuronClass(e) !== e && workspace.getNeuronClass(e) === workspace.getNeuronClass(neuronName));
    if (removeClass) {
      wspace = wspace.removeSelection(workspace.getNeuronClass(neuronName), ViewerType.ThreeD);
    }
    return;
  }

  if (!isNeuronVisible(neuronName, workspace)) {
    return;
  }

  wspace = wspace.addSelection(neuronName, ViewerType.EM); // keeping the call as this for reference
}

function onSynapseSelect(feature: Feature, workspace: Workspace) {
  const synapseName = cellFeatureName(feature);

  let wspace = workspace;
  if (isCellSelected(synapseName, workspace)) {
    wspace = wspace.removeSelection(synapseName, ViewerType.EM);
    return;
  }

  wspace = wspace.addSelection(synapseName, ViewerType.EM); // keeping the cass as this for reference
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

const NoEMData = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <Typography variant="h6" color="text.secondary">
        No EM Data Available
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Please select a dataset containing EM data to view
      </Typography>
    </Box>
  );
};

const EMStackViewer = () => {
  const currentWorkspace = useGlobalContext().getCurrentWorkspace();

  // We take the first active dataset that have segmentation data. If none, we pass to the max resolution
  let firstActiveDataset = Object.values(currentWorkspace.activeDatasets).find((d) => d.emData?.segmentationSize);
  if (!firstActiveDataset) {
    firstActiveDataset = Object.values(currentWorkspace.activeDatasets).find((d) => d.emData?.maxResolution);
  }
  if (!firstActiveDataset?.emData) {
    return <NoEMData />;
  }

  const [minSlice, maxSlice] = firstActiveDataset.emData.sliceRange;
  const startSlice = useMemo(() => {
    const storedSlice = currentWorkspace.emViewerSettings.startSlice;
    if (minSlice <= storedSlice && storedSlice <= maxSlice) {
      return storedSlice;
    }
    return Math.floor((maxSlice + minSlice) / 2);
  }, [currentWorkspace, minSlice, maxSlice]);

  const [segSlice, segSetSlice] = useState<number>(startSlice);
  const ringSize = 11;

  const mapRef = useRef<OLMap | null>(null);
  const currSegLayer = useRef<VectorLayer<Feature> | null>(null);
  const currSynSegLayer = useRef<VectorLayer<Feature> | null>(null);

  const ringEM = useRef<SlidingLayer<TileLayer<XYZ>>>();
  const ringSeg = useRef<SlidingLayer<VectorLayer<Feature>>>();
  const ringSynSeg = useRef<SlidingLayer<VectorLayer<Feature>>>();

  const [showNeurons, setShowNeurons] = useState<boolean>(currentWorkspace.emViewerSettings.showNeurons);
  const [showSynapses, setShowSynapses] = useState<boolean>(currentWorkspace.emViewerSettings.showSynapses);

  const extent = useMemo(() => [0, 0, ...getEMResolution(firstActiveDataset)], [firstActiveDataset]);

  const projection = useMemo(() => {
    return new Projection({
      code: "pixel",
      units: "pixels",
      extent: extent,
      metersPerUnit: 2e-9, // 2 nm voxels
    });
  }, [extent]);

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
  }, [currentWorkspace.getVisibleNeuronsInEM(), currentWorkspace.visibilities.neurons, currentWorkspace.getSelection(ViewerType.EM), segSlice]);

  useEffect(() => {
    if (!currSynSegLayer.current?.getSource()) {
      return;
    }

    synapsesStyleRef.current = (feature: Feature) => synapsesStyle(feature, currentWorkspace);
    onFeatureClickRef.current = makeFeatureClickHandler();
    currSynSegLayer.current.getSource().changed();
  }, [currentWorkspace.getSelection(ViewerType.EM), segSlice]);

  useEffect(() => ringSeg.current?.setVisibility(showNeurons), [showNeurons]);
  useEffect(() => ringSynSeg.current?.setVisibility(showSynapses), [showSynapses]);

  useEffect(() => {
    const hasNeuronSegmentations = !!firstActiveDataset.emData.segmentationSize;
    const hasSynapseSegmentations = !!firstActiveDataset.emData.synapsesSegmentationUrl;

    const tilegrid = new TileGrid({
      minZoom: firstActiveDataset.emData.minZoom,
      extent: extent,
      tileSize: firstActiveDataset.emData.tileSize[0],
      // resolutions: [0.5, 1, 2, 4, 8, 16, 32].reverse(),
      resolutions: [0.25, 0.5, 1, 2, 4, 8, 16].reverse(),
    });

    // const debugLayer = new TileLayer({
    // 	source: new TileDebug({
    // 		projection: projection,
    // 		tileGrid: tilegrid,
    // 	}),
    // });

    const map = new OLMap({
      target: "emviewer",
      layers: [],
      view: new View({
        zoom: firstActiveDataset.emData.minZoom,
        minZoom: firstActiveDataset.emData.minZoom,
        maxZoom: firstActiveDataset.emData.maxZoom,
        projection: projection,
        center: getCenter(extent),
        extent: extent,
        resolutions: tilegrid.getResolutions(), // forces view zoom options
        constrainOnlyCenter: true,
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
      onSlide: (slice) => {
        currentWorkspace.setEmviewerSlice(slice);
      },
    });

    if (hasNeuronSegmentations) {
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
      ringSeg.current?.setVisibility(showNeurons);

      map.on("click", (e) => onFeatureClickRef.current(e.coordinate));
    }
    if (hasSynapseSegmentations) {
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
      ringSynSeg.current?.setVisibility(showSynapses);
    }

    function handleSliceScroll(e: WheelEvent) {
      const scrollUp = e.deltaY < 0;

      if (scrollUp) {
        ringEM.current.next();
        ringSeg.current?.next();
        ringSynSeg.current?.next();
      } else {
        ringEM.current.prev();
        ringSeg.current?.prev();
        ringSynSeg.current?.prev();
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
    const minZoomAvailable = tilegrid.getMinZoom();
    // const startZoom = firstActiveDataset.emData.minZoom;
    map.getView().setZoom(minZoomAvailable);

    mapRef.current = map;

    return () => map.setTarget(null);
  }, [firstActiveDataset, extent, projection, startSlice, maxSlice, minSlice]);

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
    ringSeg.current?.goto(startSlice);
    ringSynSeg.current?.goto(startSlice);

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
    <Box
      sx={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
      }}
    >
      <SceneControls
        onZoomIn={onControlZoomIn}
        onResetView={onResetView}
        onZoomOut={onControlZoomOut}
        onPrint={onPrint}
        layers={{
          neurons: {
            label: "Neurons",
            checked: showNeurons,
            onToggle: (show) => {
              setShowNeurons(show);
              currentWorkspace.emViewerShowNeurons(show);
            },
          },
          synapses: {
            label: "Synapses",
            checked: showSynapses,
            onToggle: (show) => {
              setShowSynapses(show);
              currentWorkspace.emViewerShowSynapses(show);
            },
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

  for (const canvas of map.getViewport().querySelectorAll(".ol-layer canvas, canvas.ol-layer") as NodeListOf<HTMLCanvasElement>) {
    if (canvas.width > 0) {
      const opacity = (canvas.parentNode as HTMLElement).style.opacity || canvas.style.opacity;
      mapContext.globalAlpha = opacity === "" ? 1 : Number(opacity);
      let matrix: number[];
      const transform = canvas.style.transform;
      if (transform) {
        // Get the transform parameters from the style's transform matrix
        matrix = transform
          .match(/^matrix\(([^(]*)\)$/)[1]
          .split(",")
          .map(Number);
      } else {
        matrix = [Number.parseFloat(canvas.style.width) / canvas.width, 0, 0, Number.parseFloat(canvas.style.height) / canvas.height, 0, 0];
      }
      // Apply the transform to the export map context
      CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, matrix);
      const backgroundColor = (canvas.parentNode as HTMLElement).style.backgroundColor;
      if (backgroundColor) {
        mapContext.fillStyle = backgroundColor;
        mapContext.fillRect(0, 0, canvas.width, canvas.height);
      }
      mapContext.drawImage(canvas, 0, 0);
    }
  }

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
