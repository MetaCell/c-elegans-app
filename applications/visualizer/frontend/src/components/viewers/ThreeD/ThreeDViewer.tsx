import {Suspense, useEffect, useState} from "react";
import {CameraControls, PerspectiveCamera} from "@react-three/drei";
import {
    CAMERA_FAR,
    CAMERA_FOV,
    CAMERA_NEAR,
    CAMERA_POSITION, LIGHT_1_COLOR, LIGHT_1_POSITION, LIGHT_2_COLOR, LIGHT_2_POSITION,
    SCENE_BACKGROUND
} from "../../../../settings/threeDSettings.ts";
import {useGlobalContext} from "../../../contexts/GlobalContext.tsx";
import {useSelector} from "react-redux";
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

    const {workspaces} = useGlobalContext();
    const workspaceId = useSelector(state => state.workspaceId);
    const workspace = workspaces[workspaceId];

    useEffect(() => {
        // TODO: Implement
        if (showNeurons) {
            setInstances([
                {
                    id: 'bone',
                    url: 'bone.stl',
                    color: 'white',
                    opacity: 1
                }
            ])
        }
    }, [showNeurons, showSynapses]);

    return (
        <Canvas style={{backgroundColor: SCENE_BACKGROUND}} frameloop="demand">
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
            </Suspense>
        </Canvas>
    );
}

export default ThreeDViewer;