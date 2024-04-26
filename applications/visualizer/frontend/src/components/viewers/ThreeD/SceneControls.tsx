import GridOnIcon from '@mui/icons-material/GridOn';
import GridOffIcon from '@mui/icons-material/GridOff';
import {Box, IconButton} from "@mui/material";

function SceneControls({isWireframe, setIsWireframe}) {
    return (
        <Box position="absolute" top={20} left={20} display="flex" gap="10px" sx={{background: 'white'}}>
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