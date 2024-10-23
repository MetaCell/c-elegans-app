import { CameraControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import { useSelectedWorkspace } from "../../../hooks/useSelectedWorkspace.ts";
import { ViewerType, getNeuronUrlForDataset } from "../../../models/models.ts";
import type { Dataset } from "../../../rest";
import {
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_POSITION,
  LIGHT_1_COLOR,
  LIGHT_2_COLOR,
  LIGHT_2_POSITION,
  LIGHT_SCENE_BACKGROUND,
} from "../../../settings/threeDSettings.ts";
import DatasetPicker from "./DatasetPicker.tsx";
import Gizmo from "./Gizmo.tsx";
import Loader from "./Loader.tsx";
import type { Recorder } from "./Recorder";
import STLViewer from "./STLViewer.tsx";
import SceneControls from "./SceneControls.tsx";
import { downloadScreenshot } from "./Screenshoter.ts";
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
  const recorderRef = useRef<Recorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);

  const [sceneColor, setSceneColor] = useState(LIGHT_SCENE_BACKGROUND);

  // @ts-expect-error 'setShowNeurons' is declared but its value is never read.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showNeurons, setShowNeurons] = useState<boolean>(true);
  // @ts-expect-error 'setShowSynapses' is declared but its value is never read.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showSynapses, setShowSynapses] = useState<boolean>(true);

  useEffect(() => {
    if (!selectedDataset) return;

    const visibleNeurons = workspace.getVisibleNeuronsInThreeD();
    const newInstances: Instance[] = visibleNeurons.flatMap((neuronId) => {
      const neuron = workspace.availableNeurons[neuronId];
      const viewerData = workspace.visibilities[neuronId]?.[ViewerType.ThreeD];
      const urls = getNeuronUrlForDataset(neuron, selectedDataset.id);

      return urls.map((url) => {
        const neuronName = url.match(/([^/]+)(\.[^/]*)?$/)?.[1].replace(/(\.[^/]*)?$/, "");
        return {
          id: `${neuronName}`,
          url,
          color: viewerData?.color || "#FFFFFF",
          opacity: 1,
        };
      });
    });

    setInstances(newInstances);
  }, [selectedDataset, workspace.availableNeurons, workspace.visibilities]);

  const handleScreenshot = () => {
    downloadScreenshot(canvasRef, sceneRef, cameraRef, workspace.name);
  };

  const onCreated = (state) => {
    canvasRef.current = state.gl.domElement;
    sceneRef.current = state.scene;
    cameraRef.current = state.camera;
    glRef.current = state.gl;
  };

  return (
    <>
      <DatasetPicker datasets={dataSets} selectedDataset={selectedDataset} onDatasetChange={setSelectedDataset} />
      <Canvas style={{ backgroundColor: sceneColor }} frameloop={"demand"} gl={{ preserveDrawingBuffer: false }} onCreated={onCreated}>
        <color attach="background" args={[sceneColor]} />
        <Suspense fallback={<Loader />}>
          <PerspectiveCamera
            makeDefault
            fov={CAMERA_FOV}
            aspect={window.innerWidth / window.innerHeight}
            position={CAMERA_POSITION}
            near={CAMERA_NEAR}
            far={CAMERA_FAR}
            ref={cameraRef}
          />
          <CameraControls ref={cameraControlRef} />

          <ambientLight color={LIGHT_1_COLOR} />
          <directionalLight color={LIGHT_2_COLOR} position={LIGHT_2_POSITION} />

          <Gizmo />

          <STLViewer instances={instances} isWireframe={isWireframe} />
        </Suspense>
      </Canvas>
      <SceneControls
        cameraControlRef={cameraControlRef}
        isWireframe={isWireframe}
        setIsWireframe={setIsWireframe}
        recorderRef={recorderRef}
        handleScreenshot={handleScreenshot}
        sceneColor={sceneColor}
        setSceneColor={setSceneColor}
      />
    </>
  );
}

export default ThreeDViewer;
