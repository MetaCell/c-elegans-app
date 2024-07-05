import { Suspense, useEffect, useRef, useState } from "react";
import {
    CAMERA_FAR,
    CAMERA_FOV,
    CAMERA_NEAR,
    CAMERA_POSITION, LIGHT_1_COLOR, LIGHT_2_COLOR, LIGHT_2_POSITION,
    SCENE_BACKGROUND
} from "../../../settings/threeDSettings.ts";

import STLViewer from "./STLViewer.tsx";
import { Canvas } from "@react-three/fiber";
import Loader from "./Loader.tsx";
import Gizmo from "./Gizmo.tsx";
import { CameraControls, PerspectiveCamera } from "@react-three/drei";
import SceneControls from "./SceneControls.tsx";
import Select from "@mui/material/Select";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {FormControl, MenuItem} from "@mui/material";
import {vars} from "../../../theme/variables.ts";

const {gray400} = vars
export interface Instance {
    id: string;
    url: string;
    color: string;
    opacity: number;
}


function ThreeDViewer() {
    // @ts-ignore
    const [showNeurons, setShowNeurons] = useState<boolean>(true);
    // @ts-ignore
    const [showSynapses, setShowSynapses] = useState<boolean>(true);
    const [instances, setInstances] = useState<Instance[]>([])
    const [isWireframe, setIsWireframe] = useState<boolean>(false)

    const cameraControlRef = useRef<CameraControls | null>(null);

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
      <>
        <FormControl
          sx={{
            position: "absolute",
            top: ".5rem",
            right: ".5rem",
              zIndex: 1
          }}
        >
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={"all"}
            IconComponent={() => <KeyboardArrowDownIcon />}
            sx={{
              minWidth: "2.5rem",
              border: 0,
              color: gray400,
              fontWeight: 500,
              fontSize: ".875rem",

              "&.Mui-focused": {
                "& .MuiOutlinedInput-notchedOutline": {
                  border: 0,
                },
              },
              "& .MuiSelect-select": {
                padding: 0,
                paddingRight: "0 !important",
              },

              "& .MuiSvgIcon-root": {
                margin: "0 !important",
                color: gray400,
                fontWeight: 500,
                fontSize: "1.25rem",
              },
            }}
          >
            <MenuItem value={"all"}>All</MenuItem>
          </Select>
        </FormControl>
        <Canvas
          style={{ backgroundColor: SCENE_BACKGROUND }}
          frameloop={"demand"}
        >
          <Suspense fallback={<Loader />}>
            <PerspectiveCamera
              makeDefault
              fov={CAMERA_FOV}
              aspect={window.innerWidth / window.innerHeight}
              position={CAMERA_POSITION}
              near={CAMERA_NEAR}
              far={CAMERA_FAR}
            />
            <CameraControls ref={cameraControlRef} />

            <ambientLight color={LIGHT_1_COLOR} />
            <directionalLight
              color={LIGHT_2_COLOR}
              position={LIGHT_2_POSITION}
            />

            <Gizmo />

            <STLViewer instances={instances} isWireframe={isWireframe} />
          </Suspense>
        </Canvas>
        <SceneControls
          cameraControlRef={cameraControlRef}
          isWireframe={isWireframe}
          setIsWireframe={setIsWireframe}
        />
      </>
    );
}

export default ThreeDViewer;