import { Box } from "@mui/material";
import type { CameraControls } from "@react-three/drei";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import fcose from "cytoscape-fcose";
import { useRef } from "react";
import SceneControls from "./SceneControls.tsx";

cytoscape.use(fcose);
cytoscape.use(dagre);

const EM = () => {
  const cameraControlRef = useRef<CameraControls | null>(null);

  return (
    <Box sx={{ position: "relative", display: "flex", width: "100%", height: "100%" }}>
      <SceneControls cameraControlRef={cameraControlRef} />
    </Box>
  );
};

export default EM;
