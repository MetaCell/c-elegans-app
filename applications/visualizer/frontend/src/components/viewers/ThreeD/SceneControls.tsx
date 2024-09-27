import { GetAppOutlined, HomeOutlined, PlayArrowOutlined, RadioButtonCheckedOutlined, SettingsOutlined, TonalityOutlined } from "@mui/icons-material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { Box, Divider, IconButton, Popover, Typography } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";
import { vars } from "../../../theme/variables.ts";
import CustomFormControlLabel from "./CustomFormControlLabel.tsx";
import { Recorder } from "./Recorder.ts";
import { downloadScreenshot } from "./Screenshoter.ts";

const { gray500 } = vars;

function SceneControls({ cameraControlRef, isWireframe, setIsWireframe, recorderRef }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
    setIsRecording(!isRecording);
  };

  const open = Boolean(anchorEl);
  const id = open ? "settings-popover" : undefined;
  const handleOpenSettings = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseSettings = () => {
    setAnchorEl(null);
  };

  const handleScreenshot = () => {
    if (cameraControlRef.current) {
      downloadScreenshot(document.getElementsByTagName("canvas")[0], 0.95, { width: 3840, height: 2160 }, 1, () => true, "screenshot.png");
    }
  };

  const startRecording = () => {
    if (recorderRef.current === null) {
      const canvas = document.getElementsByTagName("canvas")[0];
      recorderRef.current = new Recorder(canvas, {
        mediaRecorderOptions: { mimeType: "video/webm" },
        blobOptions: { type: "video/webm" },
      });
      recorderRef.current.startRecording();
    }
  };

  const stopRecording = async () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording({ type: "video/webm" });
      recorderRef.current.download("CanvasRecording.webm", { type: "video/webm" });
      recorderRef.current = null;
    }
  };

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
      }}
    >
      <Tooltip title="Change settings" placement="right-start">
        <IconButton onClick={handleOpenSettings}>
          <SettingsOutlined />
        </IconButton>
      </Tooltip>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleCloseSettings}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              width: "13.75rem",
              padding: "0.25rem 0rem",
              borderRadius: "0.5rem",

              "& .MuiDivider-root": {
                margin: ".25rem 0",
              },
            },
          },
        }}
      >
        <Box
          sx={{
            padding: "0.5rem 0.25rem 0.5rem 0",
          }}
        >
          <Typography color={gray500} variant="subtitle1" mb=".5rem" ml=".5rem">
            3D viewer settings
          </Typography>
          <CustomFormControlLabel label="Neurons" tooltipTitle="tooltip" helpText="data.helpText" />

          <CustomFormControlLabel label="Synapses" tooltipTitle="tooltip" helpText="data.helpText" />
        </Box>
      </Popover>
      <Divider />
      <Tooltip title="Switch theme" placement="right-start">
        <IconButton onClick={() => setIsWireframe(!isWireframe)}>
          <TonalityOutlined />
        </IconButton>
      </Tooltip>
      <Divider />
      <Tooltip title="Zoom in" placement="right-start">
        <IconButton
          onClick={() => {
            cameraControlRef.current?.zoom(cameraControlRef.current?._camera.zoom / 2, true);
          }}
        >
          <ZoomInIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Reset to original size and position" placement="right-start">
        <IconButton
          onClick={() => {
            cameraControlRef.current?.reset(true);
          }}
        >
          <HomeOutlined />
        </IconButton>
      </Tooltip>
      <Tooltip title="Zoom out" placement="right-start">
        <IconButton
          onClick={() => {
            cameraControlRef.current?.zoom(-cameraControlRef.current?._camera.zoom / 2, true);
          }}
        >
          <ZoomOutIcon />
        </IconButton>
      </Tooltip>
      <Divider />
      <Tooltip title="Play 3D viewer" placement="right-start">
        <IconButton>
          <PlayArrowOutlined />
        </IconButton>
      </Tooltip>
      <Tooltip title={isRecording ? "Stop recording" : "Record viewer"} placement="right-start">
        <IconButton onClick={handleRecordClick}>
          <RadioButtonCheckedOutlined
            sx={{
              color: isRecording ? "red" : "inherit",
            }}
          />
        </IconButton>
      </Tooltip>
      <Tooltip title="Download graph" placement="right-start">
        <IconButton onClick={handleScreenshot}>
          <GetAppOutlined />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default SceneControls;
