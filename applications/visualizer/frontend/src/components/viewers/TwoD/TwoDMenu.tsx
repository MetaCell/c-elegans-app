// GraphMenu.tsx
import React, {useState} from 'react';
import {IconButton, Popover, ButtonGroup, Button, Typography, Box} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {GRAPH_LAYOUTS, ZOOM_DELTA} from "../../../settings/twoDSettings.tsx";
import {applyLayout} from "../../../helpers/twoD/twoDHelpers.ts";
import {ColoringOptions} from "../../../helpers/twoD/coloringStrategy/ColoringStrategy.ts";

const TwoDMenu = ({cyRef, layout, onLayoutChange, coloringOption, onColoringOptionChange}) => {
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
                    <ButtonGroup variant="text" orientation="horizontal">
                        {Object.entries(ColoringOptions).map(([key, value]) => (
                            <Button
                                key={key}
                                onClick={() => onColoringOptionChange(value)}
                                disabled={coloringOption === value}
                                sx={{background: coloringOption === value ? 'grey!important' : null}}
                            >
                                {value}
                            </Button>
                        ))}
                    </ButtonGroup>
                </Box>
                <Box>
                    <Typography>Network Layout</Typography>
                    <ButtonGroup variant="text" orientation="horizontal">
                        {Object.entries(GRAPH_LAYOUTS).map(([key, value]) => (
                            <Button
                                key={key}
                                onClick={() => onLayoutChange(value)}
                                disabled={layout === value}
                                sx={{background: layout === value ? 'grey!important' : null}}
                            >
                                {key}
                            </Button>
                        ))}
                    </ButtonGroup>
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
