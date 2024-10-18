import { Box } from "@mui/material";
import "ol/ol.css";
import { type Feature, Map as OLMap, View } from "ol";
import type { FeatureLike } from "ol/Feature";
import ScaleLine from "ol/control/ScaleLine";
import { shiftKeyOnly } from "ol/events/condition";
import { getCenter } from "ol/extent";
import GeoJSON from "ol/format/GeoJSON";
import { MouseWheelZoom, defaults as defaultInteractions } from "ol/interaction.js";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { Projection } from "ol/proj";
import { XYZ } from "ol/source";
import VectorSource from "ol/source/Vector";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import Text from "ol/style/Text";
import { TileGrid } from "ol/tilegrid";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useGlobalContext } from "../../../contexts/GlobalContext.tsx";
import { SlidingRing } from "../../../helpers/slidingRing";
import { getEMDataURL, getSegmentationURL, ViewerType } from "../../../models/models.ts";
import type { Dataset } from "../../../rest/index.ts";
import SceneControls from "./SceneControls.tsx";

const getFeatureStyle = (feature: FeatureLike) => {
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
};

const getHighlightFeatureStyle = (feature: FeatureLike) => {
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
};

const resetStyle = (feature: Feature) => {
  feature.setStyle(getFeatureStyle(feature));
};

const setHighlightStyle = (feature: Feature) => {
  feature.setStyle(getHighlightFeatureStyle(feature));
};

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

// const EMStackViewer = ({ dataset }: EMStackViewerParameters) => {
const EMStackViewer = () => {
  const currentWorkspace = useGlobalContext().getCurrentWorkspace();
  const selectedNeurons = currentWorkspace.getViewerSelectedNeurons(ViewerType.EM);

  // We take the first active dataset at the moment (will change later)
  const firstActiveDataset = Object.values(currentWorkspace.activeDatasets)?.[0];
  const [minSlice, maxSlice] = firstActiveDataset.emData.sliceRange;
  const startSlice = Math.floor((maxSlice + minSlice) / 2);
  const ringSize = 11;

  const mapRef = useRef<OLMap | null>(null);
  const currSegLayer = useRef<VectorLayer<Feature> | null>(null);
  const clickedFeature = useRef<Feature | null>(null);

  const ringEM = useRef<SlidingRing<TileLayer<XYZ>>>();
  const ringSeg = useRef<SlidingRing<VectorLayer<Feature>>>();

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

  const segLayerStyle = (feature: FeatureLike) => {
    const properties = feature.getProperties();
    if (!properties.hasOwnProperty("name")) {
      throw Error("segment doesn't have a name property");
    }
    const neuronName = properties["name"];
    if (typeof neuronName !== "string") {
      throw Error("segment name is not a string");
    }

    if (!selectedNeurons.length) {
      return getFeatureStyle(feature);
    }

    if (neuronName in selectedNeurons) {
      return getHighlightFeatureStyle(feature);
    }

    return new Style({});
  };

  const newSegLayer = useCallback(
    (dataset: Dataset, slice: number) => {
      return new VectorLayer({
        source: new VectorSource({
          url: getSegmentationURL(dataset, slice),
          format: new GeoJSON(),
        }),
        style: segLayerStyle,
        zIndex: 1,
      });
    },
    [selectedNeurons],
  );

  // const debugLayer = new TileLayer({
  // 	source: new TileDebug({
  // 		projection: projection,
  // 		tileGrid: tilegrid,
  // 	}),
  // });

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

    ringEM.current = new SlidingRing({
      cacheSize: ringSize,
      startAt: startSlice,
      extent: [minSlice, maxSlice],
      onPush: (slice) => {
        const layer = newEMLayer(firstActiveDataset, slice, tilegrid, projection);
        layer.setOpacity(0);
        map.addLayer(layer);
        return layer;
      },
      onSelected: (_, layer) => {
        layer.setOpacity(1);
      },
      onUnselected: (_, layer) => {
        layer.setOpacity(0);
      },
      onEvict: (_, layer) => {
        map.removeLayer(layer);
      },
    });

    ringSeg.current = new SlidingRing({
      cacheSize: ringSize,
      startAt: startSlice,
      extent: [minSlice, maxSlice],
      onPush: (slice) => {
        const layer = newSegLayer(firstActiveDataset, slice);
        layer.setOpacity(0);
        map.addLayer(layer);
        return layer;
      },
      onSelected: (_, layer) => {
        layer.setOpacity(1);
        currSegLayer.current = layer;
      },
      onUnselected: (_, layer) => {
        layer.setOpacity(0);
      },
      onEvict: (_, layer) => {
        map.removeLayer(layer);
      },
    });

    map.on("click", (evt) => {
      if (!currSegLayer.current) return;

      const features = currSegLayer.current.getSource().getFeaturesAtCoordinate(evt.coordinate);
      if (features.length === 0) return;

      const feature = features[0];
      if (clickedFeature.current) {
        resetStyle(clickedFeature.current);
      }

      if (feature) {
        setHighlightStyle(feature as Feature);
        clickedFeature.current = feature as Feature;
        console.log("Feature", feature.get("name"), feature);
      }
    });

    map.getTargetElement().addEventListener("wheel", (e) => {
      if (e.shiftKey) {
        return;
      }

      e.preventDefault();
      const scrollUp = e.deltaY < 0;

      if (scrollUp) {
        ringEM.current.next();
        ringSeg.current.next();
      } else {
        ringEM.current.prev();
        ringSeg.current.prev();
      }
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
      <SceneControls onZoomIn={onControlZoomIn} onResetView={onResetView} onZoomOut={onControlZoomOut} onPrint={onPrint} />
      <div id="emviewer" style={{ height: "100%", width: "100%" }} />
    </Box>
  );
};

export default EMStackViewer;

function printEMView(map: OLMap) {
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
