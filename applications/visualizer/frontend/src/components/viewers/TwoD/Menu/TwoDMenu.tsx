// GraphMenu.tsx
import React, {useState} from 'react';
import {IconButton, Popover, ButtonGroup, Button} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {ZOOM_DELTA} from "../../../../settings/twoDSettings.ts";
import {applyLayout} from "../../../../helpers/twoDHelpers.ts";

const TwoDMenu = ({cyRef, layout, onLayoutChange}) => {
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
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'}}>
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
                <ButtonGroup variant="text" orientation="horizontal">
                    <Button onClick={() => onLayoutChange('circle')}>Circle</Button>
                    <Button onClick={() => onLayoutChange('force')}>Force</Button>
                    <Button onClick={() => onLayoutChange('hierarchical')}>Hierarchical</Button>
                </ButtonGroup>
            </Popover>
            <IconButton>
                <VisibilityIcon/>
            </IconButton>
            <IconButton>
                <DownloadIcon/>
            </IconButton>
        </div>
    );
};

export default TwoDMenu;
