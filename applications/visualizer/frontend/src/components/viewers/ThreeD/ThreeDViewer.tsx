import {Suspense, useEffect, useState} from "react";
import {SCENE_BACKGROUND} from "../../../../settings/threeDSettings.ts";

import STLViewer from "./STLViewer.tsx";
import {Canvas} from "@react-three/fiber";
import Loader from "./Loader.tsx";
import BaseScene from "./BaseScene.tsx";
import Gizmo from "./Gizmo.tsx";

export interface Instance {
    id: string;
    url: string;
    color: string;
    opacity: number;
}




function ThreeDViewer() {

    const [showNeurons, setShowNeurons] = useState<boolean>(true);
    const [showSynapses, setShowSynapses] = useState<boolean>(true);
    const [instances, setInstances] = useState<Instance[]>([])


    useEffect(() => {
        if (showNeurons) {
            setInstances([
                {
                    id: 'nerve_ring',
                    url: 'nervering-SEM_adult.stl',
                    color: 'white',
                    opacity: 0.5
                },
                {
                    id: 'adal_sem',
                    url: 'ADAL-SEM_adult.stl',
                    color: 'blue',
                    opacity: 1
                }
            ])
        }
    }, [showNeurons, showSynapses]);

    return (
        <Canvas style={{backgroundColor: SCENE_BACKGROUND}}>
            <Suspense fallback={<Loader/>}>
                <BaseScene/>
                <STLViewer instances={instances}/>
                <Gizmo/>
            </Suspense>
        </Canvas>
    );
}

export default ThreeDViewer;