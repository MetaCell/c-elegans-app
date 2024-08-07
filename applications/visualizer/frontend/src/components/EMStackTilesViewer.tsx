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
import { useEffect, useRef } from "react";
import { shiftKeyOnly } from "ol/events/condition";
import { SlidingRing } from "../helpers/slidingRing";


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

		const ringEM = new SlidingRing<TileLayer<XYZ>>({
			cacheSize: ringSize,
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
			onEvict: (slice, layer) => {
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
	}, []);

	return (
		<>
			<div id="emviewer" style={{ height: "800px", width: "100%" }}/>
		</>
	);
};

export default EMStackViewer;
