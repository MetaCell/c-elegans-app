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
import { useEffect, useRef } from "react";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';

import geobuf from 'geobuf';
import Pbf from 'pbf';

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

const EMStackViewer = () => {
	const slice = 537;
	const mapRef = useRef<Map | null>(null);
	const clickedFeature = useRef<Feature | null>(null);

	const emLayer = new TileLayer({
		source: new XYZ({
			tileGrid: tilegrid,
			url: `emdata/${slice}/{x}_{y}_{z}.jpg`,
			projection: projection,
		}),
	});

	// const segLayer = new VectorLayer({
	// 	source: new VectorSource({
	// 		url: `segdata/${slice}`,
	// 		format: new GeoJSON(),
	// 	}),
	// 	style: getFeatureStyle,
	// });

	// const debugLayer = new TileLayer({
	// 	source: new TileDebug({
	// 		projection: projection,
	// 		tileGrid: tilegrid,
	// 	}),
	// });

	const scale = new ScaleLine({
		units: "metric",
	});

	useEffect(() => {
		if (mapRef.current) {
			return;
		}

		const map = new Map({
			target: "emviewer",
			layers: [
				emLayer,
				// segLayer
			],
			view: new View({
				projection: projection,
				center: getCenter(extent),
				extent: extent,
				zoom: 1,
				maxZoom: 5,
				resolutions: tilegrid.getResolutions(),
			}),
			controls: [scale],
		});

		fetch(`/segdatapbf/${slice}/`)
			.then((resp) => resp.arrayBuffer())
			.then((data) => {
				var geojson = geobuf.decode(new Pbf(data))
				var vectorSource = new VectorSource({
				features: (new GeoJSON()).readFeatures(geojson, {
					featureProjection: projection
				})
				})
				var vectorLayer = new VectorLayer({
					source: vectorSource,
					style: getFeatureStyle
				})
				map.addLayer(vectorLayer)
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

		mapRef.current = map;
	}, []);

	return (
		<>
			<div id="emviewer" style={{ height: "800px", width: "100%" }} />
		</>
	);
};

export default EMStackViewer;
