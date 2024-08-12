import { Suspense, useEffect, useRef, useState } from "react";
import {
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_POSITION,
  LIGHT_1_COLOR,
  LIGHT_2_COLOR,
  LIGHT_2_POSITION,
  SCENE_BACKGROUND,
} from "../../../settings/threeDSettings.ts";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { IconButton, Typography } from "@mui/material";
import { CameraControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useGlobalContext } from "../../../contexts/GlobalContext.tsx";
import { CheckIcon, CloseIcon } from "../../../icons";
import { vars } from "../../../theme/variables.ts";
import CustomAutocomplete from "../../CustomAutocomplete.tsx";
import Gizmo from "./Gizmo.tsx";
import Loader from "./Loader.tsx";
import STLViewer from "./STLViewer.tsx";
import SceneControls from "./SceneControls.tsx";
import type { Dataset } from "../../../rest";

const { gray100, gray600 } = vars;
export interface Instance {
  id: string;
  url: string;
  color: string;
  opacity: number;
}

function ThreeDViewer() {
  // @ts-expect-error 'setShowNeurons' is declared but its value is never read.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showNeurons, setShowNeurons] = useState<boolean>(true);
  // @ts-expect-error 'setShowSynapses' is declared but its value is never read.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showSynapses, setShowSynapses] = useState<boolean>(true);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const activeDatasets = Object.values(useGlobalContext().getCurrentWorkspace().activateDataset);

  const cameraControlRef = useRef<CameraControls | null>(null);

  useEffect(() => {
    if (showNeurons) {
      setInstances([
        {
          id: "nerve_ring",
          url: "resources/nervering-SEM_adult.stl",
          color: "white",
          opacity: 0.5,
        },
        {
          id: "adal_sem",
          url: "resources/ADAL-SEM_adult.stl",
          color: "blue",
          opacity: 1,
        },
      ]);
    }
  }, [showNeurons, showSynapses]);

  return (
    <>
      <CustomAutocomplete
        multiple={false}
        options={activeDatasets}
        getOptionLabel={(option: Dataset) => option.name}
        renderOption={(props, option) => (
          <li {...props}>
            <CheckIcon />
            <Typography>{option.name}</Typography>
          </li>
        )}
        placeholder="Start typing to search"
        className="secondary"
        id="tags-standard"
        popupIcon={<KeyboardArrowDownIcon />}
        ChipProps={{
          deleteIcon: (
            <IconButton sx={{ p: "0 !important", margin: "0 !important" }}>
              <CloseIcon />
            </IconButton>
          ),
        }}
        sx={{
          position: "absolute",
          top: ".5rem",
          right: ".5rem",
          zIndex: 1,
          minWidth: "17.5rem",
          "& .MuiInputBase-root": {
            padding: "0.5rem 2rem 0.5rem 0.75rem !important",
            backgroundColor: gray100,
            boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            "&.Mui-focused": {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: gray100,
                boxShadow: "none",
              },
            },
            "& .MuiInputBase-input": {
              color: gray600,
              fontWeight: 500,
            },
          },
        }}
        componentsProps={{
          paper: {
            sx: {
              "& .MuiAutocomplete-listbox": {
                "& .MuiAutocomplete-option": {
                  '&[aria-selected="true"]': {
                    backgroundColor: "transparent !important",
                  },
                },
              },
            },
          },
        }}
      />
      <Canvas style={{ backgroundColor: SCENE_BACKGROUND }} frameloop={"demand"}>
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
          <directionalLight color={LIGHT_2_COLOR} position={LIGHT_2_POSITION} />

          <Gizmo />

          <STLViewer instances={instances} isWireframe={isWireframe} />
        </Suspense>
      </Canvas>
      <SceneControls cameraControlRef={cameraControlRef} isWireframe={isWireframe} setIsWireframe={setIsWireframe} />
    </>
  );
}

export default ThreeDViewer;
