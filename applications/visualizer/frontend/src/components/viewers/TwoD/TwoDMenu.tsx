// GraphMenu.tsx
import React, {useState} from 'react';
import {
    IconButton,
    Popover,
    ButtonGroup,
    Button,
    Typography,
    Box,
    ToggleButtonGroup,
    ToggleButton, Switch, FormControlLabel, FormGroup, FormControl, FormLabel, Tooltip
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {GRAPH_LAYOUTS, ZOOM_DELTA} from "../../../settings/twoDSettings.tsx";
import {applyLayout} from "../../../helpers/twoD/twoDHelpers.ts";
import {ColoringOptions} from "../../../helpers/twoD/coloringStrategy/ColoringStrategy.ts";

const TwoDMenu = ({
                      cyRef,
                      layout,
                      onLayoutChange,
                      coloringOption,
                      onColoringOptionChange,
                      includeNeighboringCells,
                      setIncludeNeighboringCells,
                      includeNeighboringCellsAsIndividualCells,
                      setIncludeNeighboringCellsAsIndividualCells,
                      includeAnnotations,
                      setIncludeAnnotations
                  }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const onZoomIn = () => {
        if (cyRef.current) {
            const cy = cyRef.current;
            const zoomLevel = cy.zoom() * (1 + ZOOM_DELTA);
            const center = {x: cy.width() / 2, y: cy.height() / 2};

            cy.zoom({
                level: zoomLevel,
                renderedPosition: center
            });
        }
    };

    const onZoomOut = () => {
        if (cyRef.current) {
            const cy = cyRef.current;
            const zoomLevel = cy.zoom() * (1 - ZOOM_DELTA);
            const center = {x: cy.width() / 2, y: cy.height() / 2};

            cy.zoom({
                level: zoomLevel,
                renderedPosition: center
            });
        }
    };

    const onResetView = () => {
        if (cyRef.current) {
            cyRef.current.reset();  // Reset the zoom and pan positions
            applyLayout(cyRef, layout)
        }
    };


    const handleOpenSettings = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseSettings = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'settings-popover' : undefined;

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'}}>
            <IconButton onClick={onZoomIn}>
                <ZoomInIcon/>
            </IconButton>
            <IconButton onClick={onResetView}>
                <RestartAltIcon/>
            </IconButton>
            <IconButton onClick={onZoomOut}>
                <ZoomOutIcon/>
            </IconButton>
            <IconButton onClick={handleOpenSettings}>
                <SettingsIcon/>
            </IconButton>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleCloseSettings}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <Box>
                    <Typography>Color nodes by:</Typography>
                    <ToggleButtonGroup
                        value={coloringOption}
                        exclusive
                        onChange={(event, newColoringOption) => {
                            if (newColoringOption !== null) { // Prevent deselecting all options
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
                <Box>
                    <Typography>Network Layout</Typography>
                    <ToggleButtonGroup
                        value={layout}
                        exclusive
                        onChange={(event, newLayout) => {
                            if (newLayout !== null) { // Prevent deselecting all options
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

                <Box>
                    <Typography>Show</Typography>
                    <FormGroup>
                        <FormControlLabel
                            control={<Switch checked={includeNeighboringCells}
                                             onChange={e => setIncludeNeighboringCells(e.target.checked)}/>}
                            label="Connected Cells"
                            labelPlacement="start"
                        />
                        <Tooltip title={!includeNeighboringCells ? "Enable 'Connected Cells' to use this switch" : ""}>
                            <span>
                                <FormControlLabel
                                    control={
                                        <Switch checked={includeNeighboringCellsAsIndividualCells}
                                                onChange={e => setIncludeNeighboringCellsAsIndividualCells(e.target.checked)}
                                                disabled={!includeNeighboringCells}/>
                                    }
                                    label="as individual cells"
                                    labelPlacement="start"
                                />
                            </span>
                        </Tooltip>
                        <FormControlLabel
                            control={<Switch checked={includeAnnotations}
                                             onChange={e => setIncludeAnnotations(e.target.checked)}/>}
                            label="Types of Connections"
                            labelPlacement="start"

                        />
                    </FormGroup>
                </Box>
            </Popover>
            <IconButton>
                <VisibilityIcon/>
            </IconButton>
            <IconButton>
                <DownloadIcon/>
            </IconButton>
        </Box>
    );
};

export default TwoDMenu;
