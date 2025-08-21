import { CameraControls, Center, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useSelectedWorkspace } from "../../../hooks/useSelectedWorkspace.ts";
import { ViewerType, getNeuronUrlForDataset } from "../../../models/models.ts";
import type { Dataset, SynapseEntry } from "../../../rest";
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
import { useTexture } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

export interface NeuronInstance {
  id: string;
  url: string;
  color: string;
  opacity: number;
  renderOrder?: number;
  clickable?: boolean;
}

export interface SynapseInstance {
  id: string;
  size: number;
  position: Array<number>;
  color: string;
  opacity: number;
  renderOrder?: number;
}

const NERVE_RING = {
  id: "nerve-ring",
  url: "./nervering-SEM_adult.stl",
  color: "#d9d9d9",
  opacity: 0.3,
  renderOrder: 10,
  clickable: false,
};

const SYNAPSE_SIZE_FACTOR = 10000000.0;

const SynapseSphere = ({ synapse, isWireframe }) => {
  const texture = useTexture("texture.png");
  return (
    <mesh key={synapse.id} name={`Synapse-${synapse.id}`} position={synapse.position as [number, number, number]} renderOrder={synapse.renderOrder}>
      <sphereGeometry args={[synapse.size * 2, 16, 16]} />
      {isWireframe ? (
        <meshBasicMaterial color={synapse.color} opacity={synapse.opacity} transparent={true} wireframe={isWireframe} />
      ) : (
        <meshMatcapMaterial color={synapse.color} opacity={synapse.opacity} transparent={true} matcap={texture} />
      )}
    </mesh>
  );
};

const NerveRing = ({ instance, isWireframe }) => {
  const texture = useTexture("texture.png");
  const { id, color, opacity, renderOrder, url } = instance;
  const stl = useLoader(STLLoader, url);

  return (
    <mesh userData={{ id }} renderOrder={renderOrder}>
      <primitive attach="geometry" object={stl} />
      {isWireframe ? (
        <meshBasicMaterial color={color} opacity={opacity} wireframe={isWireframe} transparent />
      ) : (
        <meshMatcapMaterial color={color} opacity={opacity} transparent matcap={texture} />
      )}
    </mesh>
  );
};

function ThreeDViewer() {
  const workspace = useSelectedWorkspace();
  const dataSets = useMemo(() => Object.values(workspace.activeDatasets), [workspace.activeDatasets]);

  const [selectedDataset, setSelectedDataset] = useState<Dataset>(dataSets[0]);
  const [neuronInstances, setNeuronInstances] = useState<NeuronInstance[]>([]);
  const [synapseInstances, setSynapseInstances] = useState<SynapseInstance[]>([]);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);

  const cameraControlRef = useRef<CameraControls | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);

  const [sceneColor, setSceneColor] = useState(LIGHT_SCENE_BACKGROUND);

  const [showNeurons, setShowNeurons] = useState<boolean>(true);
  const [showSynapses, setShowSynapses] = useState<boolean>(true);
  const [showNerving, setShowNerving] = useState<boolean>(true);

  const allSynapses: Record<number, SynapseEntry> = useMemo(() => workspace.getAllSynapses(), [selectedDataset, workspace.visibilities.synapses]);

  useEffect(() => {
    if (!selectedDataset) return;
    if (!showNeurons) {
      setNeuronInstances([]);
      return;
    }

    const visibleNeurons = workspace.getVisibleNeuronsInThreeD();
    const newInstances: NeuronInstance[] = visibleNeurons.flatMap((neuronId) => {
      const neuron = workspace.availableNeurons[neuronId];
      const viewerData = workspace.getNeuronVisibility(neuronId)?.[ViewerType.ThreeD];
      const urls = getNeuronUrlForDataset(neuron, selectedDataset.id);

      return urls.map((url) => {
        const neuronName = url.match(/([^/]+)(\.[^/]*)?$/)?.[1].replace(/(\.[^/]*)?$/, "");
        return {
          id: `${neuronName}`,
          url,
          color: viewerData?.color || "#FFFFFF",
          opacity: 0.6,
          renderOrder: 1,
          clickable: true,
        };
      });
    });

    setNeuronInstances(newInstances);
  }, [selectedDataset, workspace.availableNeurons, workspace.visibilities.neurons, showNeurons]);

  useEffect(() => {
    if (!selectedDataset) return;
    if (!showSynapses) {
      setSynapseInstances([]);
      return;
    }
    const visibleSynapses = workspace.getVisibleSynapsesInThreeD();

    const synapses = [];
    for (const synapseId of visibleSynapses) {
      const synapse: SynapseEntry = allSynapses[synapseId];
      if (!synapse) continue; // This case shouldn't happen, but just in case
      if (!synapse.position) continue;
      if (synapse.dataset !== selectedDataset.id) continue; // Ensure synapse belongs to the selected dataset
      synapses.push({
        id: synapseId.toString(),
        size: Math.min(Math.max(0.05, synapse.size / SYNAPSE_SIZE_FACTOR), 0.5),
        position: synapse.position,
        opacity: 1.0,
        color: workspace.getSynapseVisibility(synapseId)?.[ViewerType.ThreeD]?.color || "#FFFF00",
        renderOrder: 0,
      });
    }

    setSynapseInstances(synapses);
  }, [selectedDataset, workspace.visibilities.synapses, showSynapses]);

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

          <Center>
            <group>
              {showNerving && <NerveRing instance={NERVE_RING} isWireframe={isWireframe} />}
              <STLViewer instances={neuronInstances} isWireframe={isWireframe} />
              {synapseInstances.map((i) => (
                <SynapseSphere key={i.id} synapse={i} isWireframe={isWireframe} />
              ))}
            </group>
          </Center>
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
        toggleWormBody={() => setShowNerving((prev) => !prev)}
        toggleNeurons={() => setShowNeurons((prev) => !prev)}
        toggleSynapses={() => setShowSynapses((prev) => !prev)}
        wormBodyChecked={showNerving}
        neuronsChecked={showNeurons}
        synapsesChecked={showSynapses}
      />
    </>
  );
}

export default ThreeDViewer;
