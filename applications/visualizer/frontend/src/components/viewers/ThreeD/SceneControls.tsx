import GridOnIcon from '@mui/icons-material/GridOn';
import GridOffIcon from '@mui/icons-material/GridOff';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import HouseIcon from '@mui/icons-material/House';
import {Box, IconButton} from "@mui/material";
import {ZOOM_DELTA} from "../../../../settings/threeDSettings.ts";

function SceneControls({cameraControlRef, isWireframe, setIsWireframe}) {

    return (
        <Box position="absolute" top={20} left={20} display="flex" gap="10px" sx={{background: 'white'}}>
            <IconButton onClick={() => {
                cameraControlRef.current?.reset(true);
            }} title="Reset">
                <HouseIcon/>
            </IconButton>
            <IconButton onClick={() => {
                cameraControlRef.current?.zoom(ZOOM_DELTA, true);
            }} title="Zoom In">
                <ZoomInIcon/>
            </IconButton>
            <IconButton onClick={() => {
                cameraControlRef.current?.zoom(-ZOOM_DELTA, true);
            }} title="Zoom Out">
                <ZoomOutIcon/>
            </IconButton>
            <IconButton
                color="default"
                onClick={() => setIsWireframe(!isWireframe)}
                title="Toggle Wireframe"
            >
                {isWireframe ? <GridOnIcon/> : <GridOffIcon/>}
            </IconButton>
        </Box>
    );
}

export default SceneControls;