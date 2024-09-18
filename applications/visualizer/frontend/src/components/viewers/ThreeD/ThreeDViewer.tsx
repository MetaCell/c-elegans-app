import { Suspense, useEffect, useMemo, useRef, useState } from "react";
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
import { CameraControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { OpenAPI, type Dataset } from "../../../rest";
import Gizmo from "./Gizmo.tsx";
import Loader from "./Loader.tsx";
import STLViewer from "./STLViewer.tsx";
import SceneControls from "./SceneControls.tsx";
import { useSelectedWorkspace } from "../../../hooks/useSelectedWorkspace.ts";
import DatasetPicker from "./DatasetPicker.tsx";
import { getVisibleNeuronsInThreeD } from "../../../helpers/threeD/threeDHelpers.ts";
import { getNeuronUrlForDataset, ViewerType } from "../../../models/models.ts";

export interface Instance {
  id: string;
  url: string;
  color: string;
  opacity: number;
}

function ThreeDViewer() {

  const workspace = useSelectedWorkspace();
  const dataSets = useMemo(() => Object.values(workspace.activeDatasets), [workspace.activeDatasets]);

  const [selectedDataset, setSelectedDataset] = useState<Dataset>(dataSets[0]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);

  const cameraControlRef = useRef<CameraControls | null>(null);

  // @ts-expect-error 'setShowNeurons' is declared but its value is never read.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showNeurons, setShowNeurons] = useState<boolean>(true);
  // @ts-expect-error 'setShowSynapses' is declared but its value is never read.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showSynapses, setShowSynapses] = useState<boolean>(true);


  useEffect(() => {
    if (!selectedDataset) return;
  
    const visibleNeurons = getVisibleNeuronsInThreeD(workspace);
    const newInstances: Instance[] = visibleNeurons.flatMap(neuronId => {
      const neuron = workspace.availableNeurons[neuronId];
      const viewerData = workspace.visibilities[neuronId]?.[ViewerType.ThreeD];
      const urls = getNeuronUrlForDataset(neuron, selectedDataset.id);
      
      return urls.map((url, index) => ({
        id: `${neuronId}-${index}`,
        url: `${OpenAPI.BASE}/${url}`,
        color: viewerData?.color || "#FFFFFF",
        opacity: 1,
      }));
    });
    
    setInstances(newInstances);
  }, [selectedDataset, workspace.availableNeurons, workspace.visibilities]);

  return (
    <>
      <DatasetPicker
        datasets={dataSets}
        selectedDataset={selectedDataset}
        onDatasetChange={setSelectedDataset}
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
