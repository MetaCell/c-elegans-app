import {CameraControls, PerspectiveCamera} from "@react-three/drei";
import {
    CAMERA_FAR,
    CAMERA_FOV,
    CAMERA_NEAR,
    CAMERA_POSITION,
    LIGHT_1_COLOR, LIGHT_2_COLOR, LIGHT_2_POSITION
} from "../../../../settings/threeDSettings.ts";

function BaseScene() {
    return <>
        <PerspectiveCamera
            makeDefault
            fov={CAMERA_FOV}
            aspect={window.innerWidth / window.innerHeight}
            position={CAMERA_POSITION}
            near={CAMERA_NEAR}
            far={CAMERA_FAR}
        />
        <CameraControls makeDefault/>
        <ambientLight color={LIGHT_1_COLOR}/>
        <directionalLight color={LIGHT_2_COLOR} position={LIGHT_2_POSITION}/>
    </>;
}

export default BaseScene;