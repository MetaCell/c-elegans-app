import type { CameraControls } from "@react-three/drei";
import { Box } from "@mui/material";
import "ol/ol.css";
import { type Feature, Map, View } from "ol";
import type { FeatureLike } from "ol/Feature";
import ScaleLine from "ol/control/ScaleLine";
import { getCenter } from "ol/extent";
import GeoJSON from "ol/format/GeoJSON";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { Projection } from "ol/proj";
import { TileDebug, XYZ } from "ol/source";
import VectorSource from "ol/source/Vector";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import Text from "ol/style/Text";
import { TileGrid } from "ol/tilegrid";
import { defaults as defaultInteractions, MouseWheelZoom } from 'ol/interaction.js';
import { useCallback, useEffect, useRef } from "react";
import { shiftKeyOnly } from "ol/events/condition";
import { SlidingRing } from "../../../helpers/slidingRing";
import SceneControls from "./SceneControls.tsx";
import Control from "ol/control/Control";

// const width = 42496 / 2;
// const height = 22528 / 2;
const width = 19968;
const height = 11008;

// const extent = [0, -height, width, 0];
const extent = [0, 0, width, height];

const projection = new Projection({
	code: "pixel",
	units: "pixels",
	extent: extent,
	metersPerUnit: 2e-9, // 2 nm voxels
});

const tilegrid = new TileGrid({
	extent: extent,
	tileSize: 512,
	resolutions: [0.5, 1, 2, 4, 8, 16, 32].reverse(),
});

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

const resetStyle = (feature: Feature) => {
	feature.setStyle(getFeatureStyle(feature));
};

const setHighlightStyle = (feature: Feature) => {
	const opacity = 0.5;
	const [r, g, b] = feature.get("color");
	const rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;

	const style = new Style({
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

	feature.setStyle(style);
};

const newEMLayer = (slice: number): TileLayer<XYZ> => {
	return new TileLayer({
		source: new XYZ({
			tileGrid: tilegrid,
			url: `emdata/${slice}/{x}_{y}_{z}.jpg`,
			projection: projection,
		}),
		zIndex: 0,
	});
}

const newSegLayer = (slice: number) => {
	return new VectorLayer({
		source: new VectorSource({
			url: `segdata/${slice}`,
			format: new GeoJSON(),
		}),
		style: getFeatureStyle,
		zIndex: 1,
	});
}

const EMStackViewer = () => {
	const minSlice = 0
	const maxSlice = 714
	const startSlice = 537
	const ringSize = 11

	const mapRef = useRef<Map | null>(null);
	const clickedFeature = useRef<Feature | null>(null);

	// const debugLayer = new TileLayer({
	// 	source: new TileDebug({
	// 		projection: projection,
	// 		tileGrid: tilegrid,
	// 	}),
	// });

	const scale = new ScaleLine({
		units: "metric",
	});

	const interactions = defaultInteractions({
		mouseWheelZoom: false
	}).extend([
		new MouseWheelZoom({
			condition: shiftKeyOnly
		})
	])

	useEffect(() => {
		if (mapRef.current) {
			return;
		}

		const map = new Map({
			target: "emviewer",
			layers: [],
			view: new View({
				projection: projection,
				center: getCenter(extent),
				extent: extent,
				zoom: 1,
				maxZoom: 5,
				resolutions: tilegrid.getResolutions(),
			}),
			controls: [scale],
			interactions: interactions,
		});

		const ringEM = new SlidingRing({
			cacheSize: 7,
			startAt: startSlice,
			extent: [minSlice, maxSlice],
			onPush: (slice) => {
				const layer = newEMLayer(slice)
				layer.setOpacity(0)
				map.addLayer(layer)
				return layer
			},
			onSelected: (_, layer) => {
				layer.setOpacity(1)
			},
			onUnselected: (_, layer) => {
				layer.setOpacity(0)
			},
			onEvict: (_, layer) => {
				map.removeLayer(layer)
			}
		})

		const ringSeg = new SlidingRing({
			cacheSize: ringSize,
			startAt: startSlice,
			extent: [minSlice, maxSlice],
			onPush: (slice) => {
				const layer = newSegLayer(slice)
				layer.setOpacity(0)
				map.addLayer(layer)
				return layer
			},
			onSelected: (_, layer) => {
				layer.setOpacity(1)
			},
			onUnselected: (_, layer) => {
				layer.setOpacity(0)
			},
			onEvict: (_, layer) => {
				map.removeLayer(layer)
			}
		})

		map.on("click", (evt) => {
			const feature = map.forEachFeatureAtPixel(evt.pixel, (feat) => feat);
			if (clickedFeature.current) {
				resetStyle(clickedFeature.current);
			}

			if (feature) {
				setHighlightStyle(feature as Feature);
				clickedFeature.current = feature as Feature;
				console.log("Feature", feature.get("name"), feature);
			}
		});

		map.getTargetElement().addEventListener("wheel", function(e) {
			if (e.shiftKey) {
				return
			}

			e.preventDefault()
			const scrollUp = e.deltaY < 0

			if(scrollUp) {
				ringEM.next()
				ringSeg.next()
			} else {
				ringEM.prev()
				ringSeg.prev()
			}
		})

		mapRef.current = map;

		return () => map.setTarget(null)
	}, []);

	const onControlZoomIn = useCallback(() => {
		if (!mapRef.current) return
		mapRef.current.getView().adjustZoom(1)
	}, [mapRef])

	const onControlZoomOut = useCallback(() => {
		if (!mapRef.current) return
		mapRef.current.getView().adjustZoom(-1)
	}, [mapRef])

	const onResetView = useCallback(() => {
		if (!mapRef.current) return
		const view = mapRef.current.getView()
		const center = getCenter(extent)
		view.setCenter(center)
		view.setZoom(0)
	}, [mapRef])

	const onPrint = useCallback(() => {
		if (!mapRef.current) return
		mapRef.current.once('rendercomplete', () => {
			printEMView(mapRef.current)
		})
		mapRef.current.renderSync();
	}, [mapRef])

	return (
		<Box sx={{ position: "relative", display: "flex", width: "100%", height: "100%" }}>
			<SceneControls
				onZoomIn={onControlZoomIn}
				onResetView={onResetView}
				onZoomOut={onControlZoomOut}
				onPrint={onPrint}
			/>
			<div id="emviewer" style={{ height: "100%", width: "100%" }}/>
		</Box>
	);
};

export default EMStackViewer;

function printEMView(map: Map) {
	const mapCanvas = document.createElement('canvas');

    const size = map.getSize();
    mapCanvas.width = size[0];
    mapCanvas.height = size[1];

	const mapContext = mapCanvas.getContext('2d');

	Array.prototype.forEach.call(
      map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer'),
      function (canvas) {
        if (canvas.width > 0) {
          const opacity =
            canvas.parentNode.style.opacity || canvas.style.opacity;
          mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
          let matrix;
          const transform = canvas.style.transform;
          if (transform) {
            // Get the transform parameters from the style's transform matrix
            matrix = transform
              .match(/^matrix\(([^\(]*)\)$/)[1]
              .split(',')
              .map(Number);
          } else {
            matrix = [
              parseFloat(canvas.style.width) / canvas.width,
              0,
              0,
              parseFloat(canvas.style.height) / canvas.height,
              0,
              0,
            ];
          }
          // Apply the transform to the export map context
          CanvasRenderingContext2D.prototype.setTransform.apply(
            mapContext,
            matrix,
          );
          const backgroundColor = canvas.parentNode.style.backgroundColor;
          if (backgroundColor) {
            mapContext.fillStyle = backgroundColor;
            mapContext.fillRect(0, 0, canvas.width, canvas.height);
          }
          mapContext.drawImage(canvas, 0, 0);
        }
      },
    );

    mapContext.globalAlpha = 1;
    mapContext.setTransform(1, 0, 0, 1, 0, 0);

	// var element = document.createElement('a');
	// element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	// element.setAttribute('download', filename);

	// element.style.display = 'none';
	// document.body.appendChild(element);

	// element.click();

	// document.body.removeChild(element);

	const link = document.createElement('a');
    link.href = mapCanvas.toDataURL();
	link.download = 'em.png'
	link.style.display = 'none'
	document.body.appendChild(link)

    link.click();

	document.body.removeChild(link)
}
