import { GetAppOutlined, HomeOutlined, PlayArrowOutlined, RadioButtonCheckedOutlined, SettingsOutlined, TonalityOutlined } from "@mui/icons-material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { Box, Divider, IconButton, Popover, Typography } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";
import { useGlobalContext } from "../../../contexts/GlobalContext.tsx";
import { vars } from "../../../theme/variables.ts";
import CustomFormControlLabel from "./CustomFormControlLabel.tsx";

const { gray500 } = vars;

function SceneControls({ cameraControlRef, isWireframe, setIsWireframe }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const context = useGlobalContext();

  const open = Boolean(anchorEl);
  const id = open ? "settings-popover" : undefined;
  const handleOpenSettings = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseSettings = () => {
    setAnchorEl(null);
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
      <Tooltip title="Record viewer" placement="right-start">
        <IconButton>
          <RadioButtonCheckedOutlined />
        </IconButton>
      </Tooltip>
      <Tooltip title="Download graph" placement="right-start">
        <IconButton>
          <GetAppOutlined />
        </IconButton>
      </Tooltip>

      <Tooltip title="SAVE" placement="right-start">
        <IconButton
          onClick={() => {
            console.log("CTX", context);
          }}
        >
          <ZoomOutIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default SceneControls;
