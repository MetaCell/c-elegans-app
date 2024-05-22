// GraphMenu.tsx
import React, {useState} from 'react';
import {IconButton, Popover, ButtonGroup, Button, Typography, Box} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {GRAPH_LAYOUTS, ColorMapStrategy, ZOOM_DELTA} from "../../../settings/twoDSettings.tsx";
import {applyLayout} from "../../../helpers/twoDHelpers.ts";

const TwoDMenu = ({cyRef, layout, onLayoutChange, colorMapStrategy, onColorMapStrategyChange}) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const onZoomIn = () => {
        if (cyRef.current) {
            cyRef.current.zoom(cyRef.current.zoom() * (1 + ZOOM_DELTA));
        }
    };

    const onZoomOut = () => {
        if (cyRef.current) {
            cyRef.current.zoom(cyRef.current.zoom() * (1 - ZOOM_DELTA));
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
            <Typography>Network Layout</Typography>
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
                        {Object.entries(ColorMapStrategy).map(([key, value]) => (
                            <Button
                                key={key}
                                onClick={() => onColorMapStrategyChange(value)}
                                disabled={colorMapStrategy === value}
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
