import { GetAppOutlined, HomeOutlined, TuneOutlined, VisibilityOutlined } from "@mui/icons-material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { Box, Divider, FormControlLabel, FormGroup, IconButton, Popover, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { ColoringOptions } from "../../../helpers/twoD/coloringHelper.ts";
import { GRAPH_LAYOUTS, ZOOM_DELTA } from "../../../settings/twoDSettings.tsx";
import { vars } from "../../../theme/variables.ts";
import CustomSwitch from "../../ViewerContainer/CustomSwitch.tsx";
import QuantityInput from "./NumberInput.tsx";
import { useSelectedWorkspace } from "../../../hooks/useSelectedWorkspace.ts";
import { applyLayout } from "../../../helpers/twoD/twoDHelpers.ts";

const { gray500 } = vars;

const TwoDMenu = ({
  cy,
  layout,
  onLayoutChange,
  coloringOption,
  onColoringOptionChange,
  includeNeighboringCells,
  setIncludeNeighboringCells,
  includeNeighboringCellsAsIndividualCells,
  setIncludeNeighboringCellsAsIndividualCells,
  includeAnnotations,
  setIncludeAnnotations,
  thresholdChemical,
  setThresholdChemical,
  thresholdElectrical,
  setThresholdElectrical,
  includeLabels,
  setIncludeLabels,
  includePostEmbryonic,
  setIncludePostEmbryonic,
}) => {
  const workspace = useSelectedWorkspace();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const onZoomIn = () => {
    if (!cy) {
      return;
    }
    const zoomLevel = cy.zoom() * (1 + ZOOM_DELTA);
    const center = { x: cy.width() / 2, y: cy.height() / 2 };

    cy.zoom({
      level: zoomLevel,
      renderedPosition: center,
    });
  };

  const onZoomOut = () => {
    if (!cy) {
      return;
    }
    const zoomLevel = cy.zoom() * (1 - ZOOM_DELTA);
    const center = { x: cy.width() / 2, y: cy.height() / 2 };
    cy.zoom({
      level: zoomLevel,
      renderedPosition: center,
    });
  };

  const onResetView = () => {
    if (!cy) {
      return;
    }
    applyLayout(cy, layout);
  };

  const handleOpenSettings = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseSettings = () => {
    setAnchorEl(null);
  };

  const handleDownloadClick = () => {
    if (!cy) return;

    const pngDataUrl = cy.png({
      output: "base64uri",
      bg: "white",
      full: true,
      scale: 2,
    });

    // Create a link element
    const link = document.createElement("a");
    link.href = pngDataUrl;
    link.download = `${workspace.name}.png`;

    // Programmatically trigger a click event to download the image
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const open = Boolean(anchorEl);
  const id = open ? "settings-popover" : undefined;

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
      <Tooltip title="Return to original size" placement="right-start">
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
      <Tooltip title="Set parameters" placement="right-start">
        <IconButton onClick={handleOpenSettings}>
          <TuneOutlined />
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
              padding: ".5rem 0",
              borderRadius: "0.5rem",

              "& .MuiDivider-root": {
                margin: ".25rem 0",
              },
            },
          },
        }}
      >
        <Box padding="0.5rem 1rem">
          <Typography color={gray500} variant="subtitle1" mb=".5rem">
            Color nodes by:
          </Typography>
          <ToggleButtonGroup
            value={coloringOption}
            exclusive
            onChange={(_, newColoringOption) => {
              if (newColoringOption !== null) {
                // Prevent deselecting all options
                onColoringOptionChange(newColoringOption);
              }
            }}
            aria-label="coloring options"
          >
            {Object.entries(ColoringOptions).map(([key, value]) => (
              <ToggleButton key={key} value={value} aria-label={value}>
                {value}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Divider />
        <Box padding="0.5rem 1rem">
          <Typography color={gray500} variant="subtitle1" mb=".5rem">
            Neuroconnectors have at least:
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Typography variant="caption" color={gray500}>
                Chemical Synapses
              </Typography>
              <QuantityInput
                value={thresholdChemical}
                onIncrement={() => setThresholdChemical(thresholdChemical + 1)}
                onDecrement={() => {
                  if (thresholdChemical > 1) {
                    setThresholdChemical(thresholdChemical - 1);
                  }
                }}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="caption" color={gray500}>
                Gap Junctions
              </Typography>
              <QuantityInput
                value={thresholdElectrical}
                onIncrement={() => setThresholdElectrical(thresholdElectrical + 1)}
                onDecrement={() => {
                  if (thresholdElectrical > 1) {
                    setThresholdElectrical(thresholdElectrical - 1);
                  }
                }}
              />
            </Box>
          </Box>
        </Box>
        <Divider />
        <Box padding="0.5rem 1rem">
          <Typography color={gray500} variant="subtitle1" mb=".5rem">
            Network Layout
          </Typography>
          <ToggleButtonGroup
            value={layout}
            exclusive
            onChange={(_, newLayout) => {
              if (newLayout !== null) {
                // Prevent deselecting all options
                onLayoutChange(newLayout);
              }
            }}
            aria-label="layout options"
          >
            {Object.entries(GRAPH_LAYOUTS).map(([key, value]) => (
              <ToggleButton key={key} value={value} aria-label={key}>
                {key}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Divider />
        <Box padding="0.5rem 1rem">
          <Typography color={gray500} variant="subtitle1" mb=".5rem">
            Show
          </Typography>
          <FormGroup
            sx={{
              gap: ".5rem",
              "& .MuiFormControlLabel-root": {
                margin: 0,
              },
            }}
          >
            <FormControlLabel
              control={<CustomSwitch checked={includeNeighboringCells} onChange={(e) => setIncludeNeighboringCells(e.target.checked)} showTooltip={false} />}
              label="Connected cells"
            />
            <Tooltip title={!includeNeighboringCells ? "Enable 'Connected Cells' to use this switch" : ""}>
              <FormControlLabel
                control={
                  <CustomSwitch
                    checked={includeNeighboringCellsAsIndividualCells}
                    onChange={(e) => setIncludeNeighboringCellsAsIndividualCells(e.target.checked)}
                    disabled={!includeNeighboringCells}
                    showTooltip={false}
                  />
                }
                label="as individual cells"
              />
            </Tooltip>
            <FormControlLabel
              control={<CustomSwitch checked={includeLabels} onChange={(e) => setIncludeLabels(e.target.checked)} showTooltip={false} />}
              label="Show connection labels"
            />
            <FormControlLabel
              control={<CustomSwitch checked={includeAnnotations} onChange={(e) => setIncludeAnnotations(e.target.checked)} showTooltip={false} />}
              label="Types of connections"
            />
            <FormControlLabel
              control={<CustomSwitch checked={includePostEmbryonic} onChange={(e) => setIncludePostEmbryonic(e.target.checked)} showTooltip={false} />}
              label="Post-embryonic cells"
            />
          </FormGroup>
        </Box>
      </Popover>
      <Tooltip title="Show/Hide neurons (Coming Soon)" placement="right-start">
        <IconButton disabled={true}>
          <VisibilityOutlined />
        </IconButton>
      </Tooltip>
      <Divider />
      <Tooltip title="Download graph" placement="right-start">
        <IconButton onClick={handleDownloadClick}>
          <GetAppOutlined />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default TwoDMenu;
