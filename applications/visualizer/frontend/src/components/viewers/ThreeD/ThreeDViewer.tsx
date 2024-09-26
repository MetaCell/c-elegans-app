import { Box } from "@mui/system";
import { CameraControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, createRef, useEffect, useMemo, useRef, useState } from "react";
import { useSelectedWorkspace } from "../../../hooks/useSelectedWorkspace.ts";
import { ViewerType, getNeuronUrlForDataset } from "../../../models/models.ts";
import { type Dataset, OpenAPI } from "../../../rest";
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
import DatasetPicker from "./DatasetPicker.tsx";
import Gizmo from "./Gizmo.tsx";
import Loader from "./Loader.tsx";
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

  const ref = createRef<HTMLDivElement | null>();

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

      return urls.map((url, index) => ({
        id: `${neuronId}-${index}`,
        url: `${OpenAPI.BASE}/${url}`,
        color: viewerData?.color || "#FFFFFF",
        opacity: 1,
      }));
    });

    setInstances(newInstances);
  }, [selectedDataset, workspace.availableNeurons, workspace.visibilities]);

  const handleScreenshot = () => {
    if (ref.current) {
      // Use the Screenshoter utility functionthis.sceneRef.current && this.sceneRef.current.getElementsByTagName('canvas')[0]
      downloadScreenshot(ref.current && ref.current.getElementsByTagName("canvas")[0], 0.95, { width: 3840, height: 2160 }, 1, () => true, "screenshot.png");
    }
  };
  return (
    <Box ref={ref}>
      <DatasetPicker datasets={dataSets} selectedDataset={selectedDataset} onDatasetChange={setSelectedDataset} />
      <Canvas style={{ backgroundColor: SCENE_BACKGROUND }} gl={{ preserveDrawingBuffer: true }}>
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
      <SceneControls cameraControlRef={cameraControlRef} isWireframe={isWireframe} setIsWireframe={setIsWireframe} handleScreenshot={handleScreenshot} />
    </Box>
  );
}

export default ThreeDViewer;
