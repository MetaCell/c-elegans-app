import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import {Box, Divider, IconButton} from "@mui/material";
import {GridOffOutlined, GridOnOutlined, HomeOutlined} from "@mui/icons-material";

function SceneControls({cameraControlRef, isWireframe, setIsWireframe}) {
    return (
        <Box
          sx={{
            display: 'flex',
            flexDirection:'column',
            gap: '.25rem',
            position: 'absolute',
            top: '.5rem',
            left: '.5rem',
            backgroundColor: '#fff',
            borderRadius: '0.5rem',
            border: '1px solid #ECECE9',
            boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
            padding: '0.25rem'
          }}
        >
            <IconButton onClick={() => {
                cameraControlRef.current?.zoom(cameraControlRef.current?._camera.zoom / 2, true);
            }} title="Zoom In">
                <ZoomInIcon/>
            </IconButton>
            <IconButton onClick={() => {
              cameraControlRef.current?.reset(true);
            }} title="Reset">
              <HomeOutlined />
            </IconButton>
            <IconButton onClick={() => {
                cameraControlRef.current?.zoom(-cameraControlRef.current?._camera.zoom / 2, true);
            }} title="Zoom Out">
                <ZoomOutIcon/>
            </IconButton>
            <Divider />
            <IconButton
                color="default"
                onClick={() => setIsWireframe(!isWireframe)}
                title="Toggle Wireframe"
            >
                {isWireframe ? <GridOnOutlined /> : <GridOffOutlined />}
            </IconButton>
        </Box>
    );
}

export default SceneControls;