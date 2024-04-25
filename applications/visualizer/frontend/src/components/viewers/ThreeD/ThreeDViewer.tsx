import {Suspense, useEffect, useState} from "react";
import {CameraControls, GizmoHelper, GizmoViewport, PerspectiveCamera} from "@react-three/drei";
import {
    CAMERA_FAR,
    CAMERA_FOV,
    CAMERA_NEAR,
    CAMERA_POSITION, LIGHT_1_COLOR, LIGHT_1_POSITION, LIGHT_2_COLOR, LIGHT_2_POSITION,
    SCENE_BACKGROUND
} from "../../../../settings/threeDSettings.ts";

import STLViewer from "./STLViewer.tsx";
import {Canvas} from "@react-three/fiber";
import Loader from "./Loader.tsx";

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
        // TODO: Understand why adal disappears
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
                <PerspectiveCamera
                    makeDefault
                    fov={CAMERA_FOV}
                    aspect={window.innerWidth / window.innerHeight}
                    position={CAMERA_POSITION}
                    near={CAMERA_NEAR}
                    far={CAMERA_FAR}
                />
                <CameraControls makeDefault/>
                <directionalLight color={LIGHT_1_COLOR} position={LIGHT_1_POSITION}/>
                <directionalLight color={LIGHT_2_COLOR} position={LIGHT_2_POSITION}/>
                <STLViewer instances={instances}/>
                <GizmoHelper
                    alignment="bottom-right"
                    margin={[80, 80]}
                >
                    <GizmoViewport axisColors={['red', 'green', 'blue']} labels={['Posterior', 'Dorsal', 'Left']}
                                   labelColor="white" hideNegativeAxes hideAxisHeads/>
                </GizmoHelper>
            </Suspense>
        </Canvas>
    );
}

export default ThreeDViewer;