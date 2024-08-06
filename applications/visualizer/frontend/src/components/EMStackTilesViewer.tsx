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
import BaseLayer from "ol/layer/Base";
import { defaults as defaultInteractions, MouseWheelZoom } from 'ol/interaction.js';
import { useEffect, useRef } from "react";
import { shiftKeyOnly } from "ol/events/condition";


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
			map: map,
			cacheSize: ringSize,
			sliceExtent: [minSlice, maxSlice],
			startSlice: startSlice,
			newLayer: newEMLayer,
			zIndex: 0,
		})

		ringEM.debug()

		const ringSeg = new SlidingRing({
			map: map,
			cacheSize: ringSize,
			sliceExtent: [minSlice, maxSlice],
			startSlice: startSlice,
			newLayer: newSegLayer,
			zIndex: 1,
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
				// ++slice
				ringEM.next()
				ringEM.debug()

				ringSeg.next()
			} else {
				ringEM.prev()
				ringEM.debug()

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


export interface SlidingRingOpts {
	map: Map;
	newLayer: (slice: number) => BaseLayer;
	cacheSize?: number;
	sliceExtent: [number, number];
	startSlice: number;
	zIndex?: number;
}

export class SlidingRing {
	private map: Map;
	private newLayer: (slice: number) => BaseLayer;
	private zIndex;

	private ring: Array<{
		slice: number;
		layer: BaseLayer;
	}>;
	private ringHalfSize: number;

	private currSlice: number;
	private minSlice: number;
	private maxSlice: number;

	private pos: number; // ring current position
	private tail: number;
	private head: number;

	private backgroundZIndex: number = -999

	constructor(options: SlidingRingOpts) {
		const defaultOpts = {
			cacheSize: 11,
			zIndex: 0,
		}

		const opts = {...defaultOpts, ...options}

		if (opts.cacheSize < 3) {
			throw Error("ring must have a cache size greater than 3 to be functional")
		}

		const minSlice = opts.sliceExtent[0]
		const maxSlice = opts.sliceExtent[1]

		if (minSlice < 0) {
			throw Error("bad extent: can not have negative indexes")
		}

		if (minSlice >= maxSlice) {
			throw Error("bad extent: set [min, max]")
		}

		if (opts.startSlice > maxSlice || opts.startSlice < minSlice) {
			throw Error("startSlice must be between the extent bounds")
		}

		if (maxSlice - minSlice < opts.cacheSize) {
			console.warn("setting cache size to extent bounds to save memory")
			opts.cacheSize = maxSlice - minSlice
		}

		this.map = opts.map;
		this.newLayer = opts.newLayer;
		this.zIndex = opts.zIndex;

		this.ring = new Array(opts.cacheSize)
		this.ringHalfSize = Math.floor(opts.cacheSize / 2)

		this.currSlice = opts.startSlice
		this.minSlice = minSlice
		this.maxSlice = maxSlice

		// initialize ring buffer
		let initTailSlice = this.currSlice - this.ringHalfSize
		let initHeadSlice = this.currSlice + this.ringHalfSize

		if (initTailSlice < this.minSlice) {
			initTailSlice = this.minSlice
		}
		if (initHeadSlice > this.maxSlice) {
			initHeadSlice = this.maxSlice
			initTailSlice = initHeadSlice - this.ring.length + 1
		}

		for (let i = 0; i < this.ring.length; i++) {
			const slice = initTailSlice + i
			const layer = this.newLayer(slice)
			this.hideLayer(layer)

			this.ring[i] = {
				slice: slice,
				layer: layer
			}

			this.map.addLayer(layer)
		}

		// set current position
		this.pos = this.currSlice - initTailSlice
		this.head = this.ring.length - 1
		this.tail = 0

		// set current layer visible
		this.showLayer(this.ring[this.pos].layer)
	}

	next() {
		const nextSlice = this.currSlice + 1
		if (nextSlice > this.maxSlice) return

		// TODO: update map with curr layer
		const nextPos = (this.pos + this.ring.length + 1) % this.ring.length
		this.showLayer(this.ring[nextPos].layer)
		this.hideLayer(this.ring[this.pos].layer)

		const newHeadSlice = this.ring[this.head].slice + 1

		// slide window
		if (newHeadSlice <= this.maxSlice && nextSlice - this.ring[this.tail].slice > this.ringHalfSize) {
			this.evict(this.tail)

			const layer = this.newLayer(newHeadSlice)
			this.hideLayer(layer)
			this.map.addLayer(layer)

			this.ring[this.tail] = {
				slice: newHeadSlice,
				layer: layer,
			}

			// update window
			this.head = this.tail
			this.tail = (this.tail + this.ring.length + 1) % this.ring.length
		}

		// update current state
		this.currSlice = nextSlice
		this.pos = nextPos
	}

	prev() {
		const prevSlice = this.currSlice - 1
		if (prevSlice < this.minSlice) return

		// TODO: update map curr layer
		const prevPos = (this.pos + this.ring.length - 1) % this.ring.length
		this.showLayer(this.ring[prevPos].layer)
		this.hideLayer(this.ring[this.pos].layer)

		const newTailSlice = this.ring[this.tail].slice - 1

		// slide window
		if (newTailSlice >= this.minSlice && this.ring[this.head].slice - prevSlice > this.ringHalfSize){
			this.evict(this.head)

			const layer = this.newLayer(newTailSlice)
			this.hideLayer(layer)
			this.map.addLayer(layer)

			this.ring[this.head] = {
				slice: newTailSlice,
				layer: layer,
			}

			this.tail = this.head
			this.head = (this.tail + this.ring.length - 1) % this.ring.length
		}

		// update current state
		this.currSlice = prevSlice
		this.pos = prevPos
	}

	private showLayer(layer: BaseLayer) {
		layer.setZIndex(this.zIndex)
		layer.setOpacity(1)
	}

	private hideLayer(layer: BaseLayer) {
		const backgroudZIndex = -999
		layer.setZIndex(backgroudZIndex)
		layer.setOpacity(0)
	}

	private evict(pos: number) {
		this.map.removeLayer(this.ring[pos].layer)
		console.debug(`evicted: slice=${this.ring[pos].slice}`)
	}

	debug() {
		let text = '['

		for (let i = 0; i < this.ring.length; i++) {
			if (this.ring[i] === undefined) {
				text = text. concat('?')
				continue
			}

			switch (true) {
				case i === this.pos:
					text = text.concat('*')
					break
				case i === this.tail:
					text = text.concat("-")
					break
				case i === this.head:
					text = text.concat("+")
			}

			text = text.concat(`${this.ring[i].slice}`)
			if (i !== this.ring.length - 1) text = text.concat(', ')
		}
		text = text.concat(']')
		console.log(text)
	}
}
