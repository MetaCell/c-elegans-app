import { Map, View } from 'ol';
import LayerGroup from 'ol/layer/Group';
import Layer from 'ol/layer/Layer';
import TileLayer from 'ol/layer/Tile';
import { TileDebug, TileImage, XYZ } from 'ol/source';
import { useEffect, useRef, useState } from 'react';

const EMStackViewer = () => {
    const mapRef = useRef<Map | null>(null)
    const indexLayer = useRef<Layer | null>(null)
    // const slice = useRef<number>(537)
    const [slice, setSlice] = useState<number>(537)
    const cacheSize = 500

    const increaseSlice = () => {
        if (!indexLayer.current) {
            return
        }
        setSlice(slice + 1);
        mapRef.current?.removeLayer(indexLayer.current)
        mapRef.current?.addLayer(
            new TileLayer({
                source: new TileImage({
                    cacheSize: cacheSize,
                    url: `emdata/${slice}/{x}_{y}_{z}.jpg`
                })
            })
        )

    }

    const decreaseSlice = () => {
        if (!indexLayer.current) {
            return
        }
        // slice.current--;
        setSlice(slice + 1)
        mapRef.current?.removeLayer(indexLayer.current)
        mapRef.current?.addLayer(
            new TileLayer({
                source: new TileImage({
                    cacheSize: cacheSize,

                    url: `emdata/${slice}/{x}_{y}_{z}.jpg`
                })
            })
        )
    }

    useEffect(() => {
        if (mapRef.current) {
            return
        }
        indexLayer.current = new TileLayer({
            // minZoom: 0,
            source: new TileImage({
                cacheSize: cacheSize,

                url: `emdata/${slice}/{x}_{y}_{z}.jpg`
            })
        })
        mapRef.current = new Map({
            target: "mapdiv",
            layers: [
                indexLayer.current,
                new TileLayer({
                    source: new TileDebug(),
                }),
            ],
            view: new View({
                center: [0, 0],
                zoom: 0,
                maxZoom: 6,
            }),
            controls: []
        })
    }, [])



    return (<>
        <button onClick={() => decreaseSlice()}>Slice --</button>
        <button onClick={() => increaseSlice()}>Slice ++</button>
        <h3>slice: {slice}</h3>
        <div id="mapdiv" style={{ height: "500px", width: "100%" }} />
    </>)
}


export default EMStackViewer;