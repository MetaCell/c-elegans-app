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
import { WheelEventHandler, useEffect, useRef, useState } from "react";
import { shiftKeyOnly } from "ol/events/condition";
import Layer from "ol/layer/Layer";

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
	});
}

const newSegLayer = (slice: number) => {
	return new VectorLayer({
		source: new VectorSource({
			url: `segdata/${slice}`,
			format: new GeoJSON(),
		}),
		style: getFeatureStyle,
	});
}

const updateSliceLayer = (map: Map, slice: number) => {
	map.getAllLayers().map(l => {
		map.removeLayer(l)
	})
	map.addLayer(newEMLayer(slice))
	map.addLayer(newSegLayer(slice))
}

const EMStackViewer = () => {
	const minSlice = 0
	const maxSlice = 714

	let slice = 537

	const mapRef = useRef<Map | null>(null);
	const clickedFeature = useRef<Feature | null>(null);

	const emLayer = newEMLayer(slice)
	const segLayer = newSegLayer(slice)

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
			layers: [emLayer, segLayer],
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

			if(scrollUp && slice < maxSlice) {
				++slice
			}

			if (!scrollUp && slice > minSlice){
				--slice
			}

			updateSliceLayer(map, slice)
			console.debug(`updated view to slice nº ${slice}`)
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
