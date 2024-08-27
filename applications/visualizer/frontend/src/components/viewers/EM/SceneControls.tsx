import { FileDownloadOutlined, HomeOutlined } from "@mui/icons-material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { Box, Divider, IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";

interface ScaleControlsHandlers {
  onZoomIn: () => void;
  onResetView: () => void;
  onZoomOut: () => void;
  onPrint: () => void;
}

function SceneControls({ onZoomIn, onResetView, onZoomOut, onPrint }: ScaleControlsHandlers) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: ".25rem",
        position: "absolute",
        top: ".5rem",
        left: ".5rem",
        backgroundColor: "#fff",
        borderRadius: "0.5rem",
        border: "1px solid #ECECE9",
        boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
        padding: "0.25rem",
        zIndex: 1,
      }}
    >
      <Tooltip title="Zoom in" placement="right-start">
        <IconButton onClick={onZoomIn}>
          <ZoomInIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Reset to original size and position" placement="right-start">
        <IconButton onClick={onResetView}>
          <HomeOutlined />
        </IconButton>
      </Tooltip>
      <Tooltip title="Zoom out" placement="right-start">
        <IconButton onClick={onZoomOut}>
          <ZoomOutIcon />
        </IconButton>
      </Tooltip>
      <Divider />
      {/* <Tooltip title="Add comment" placement="right-start">
        <IconButton>
          <TextsmsOutlined />
        </IconButton>
      </Tooltip>
      <Divider /> */}
      <Tooltip title="Download image" placement="right-start">
        <IconButton onClick={onPrint}>
          <FileDownloadOutlined />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default SceneControls;
