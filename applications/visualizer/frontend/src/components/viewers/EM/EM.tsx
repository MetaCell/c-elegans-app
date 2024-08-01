import { Box } from "@mui/material";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import fcose from "cytoscape-fcose";

cytoscape.use(fcose);
cytoscape.use(dagre);

const EM = () => {
  return (
    <Box sx={{ position: "relative", display: "flex", width: "100%", height: "100%" }}>
    
    </Box>
  );
};

export default EM;
