import { FileDownloadOutlined, HomeOutlined, SettingsOutlined } from "@mui/icons-material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { Box, Divider, IconButton, Popover, Typography } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";
import { vars } from "../../../theme/variables.ts";
import CustomFormControlLabel from "../../CustomFormControlLabel";

const { gray500 } = vars;

interface LayerControlHandler {
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}

type LayersControlsHandlers = {
  [key in "neurons" | "synapses"]: LayerControlHandler;
};

interface ScaleControlsHandlers {
  onZoomIn: () => void;
  onResetView: () => void;
  onZoomOut: () => void;
  onPrint: () => void;
  layers: LayersControlsHandlers;
}

function SceneControls({ onZoomIn, onResetView, onZoomOut, onPrint, layers }: ScaleControlsHandlers) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const open = Boolean(anchorEl);
  const id = open ? "settings-popover" : undefined;

  const handleOpenSettings = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseSettings = () => {
    setAnchorEl(null);
  };

  const layersControlsElems = Object.entries(layers).map(([key, { label, checked, onToggle }]) => {
    return (
      <CustomFormControlLabel
        key={key}
        label={label}
        tooltipTitle="tooltip"
        helpText="data.helpText"
        checked={checked}
        onChange={(_, checked) => onToggle(checked)}
      />
    );
  });

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
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              width: "13.75rem",
              padding: "0.25rem 0.25rem",
              borderRadius: "0.5rem",
              marginLeft: "10px",
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",

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
            EM viewer settings
          </Typography>
          {layersControlsElems}
        </Box>
      </Popover>
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
