import React from 'react';
import {Typography, Card, CardContent, CardActionArea, Grid, Container} from '@mui/material';
import {createEmptyWorkspace} from "../helpers/initialWorkspacesHelper.ts";
import {useGlobalContext} from "../contexts/GlobalContext.tsx";

function AppLauncher() {

    const {workspaces, addWorkspace, switchWorkspace} = useGlobalContext();


    const handleTemplateClick = () => {
        console.log('Template option clicked');
    };

    const handleBlankClick = () => {
        const workspace =createEmptyWorkspace(`Workspace ${Object.keys(workspaces).length + 1}`)
        addWorkspace(workspace)
        switchWorkspace(workspace.id)
    };

    const handlePasteUrlClick = () => {
        console.log('Paste URL option clicked');
    };

    return (
        <Container maxWidth="md" style={{marginTop: '50px'}}>
            <Typography variant="h3" component="h1" gutterBottom align="center">
                Welcome to C. Elegans
            </Typography>
            <Typography variant="h6" component="p" gutterBottom align="center">
                Choose one of the options below to get started.
            </Typography>
            <Grid container spacing={4} justifyContent="center" style={{marginTop: '20px'}}>
                <Grid item xs={12} sm={6} md={4}>
                    <Card>
                        <CardActionArea onClick={handleTemplateClick}>
                            <CardContent>
                                <Typography variant="h5" component="h2" align="center">
                                    Start from Template
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Card>
                        <CardActionArea onClick={handleBlankClick}>
                            <CardContent>
                                <Typography variant="h5" component="h2" align="center">
                                    Start with a Blank Canvas
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Card>
                        <CardActionArea onClick={handlePasteUrlClick}>
                            <CardContent>
                                <Typography variant="h5" component="h2" align="center">
                                    Paste URL
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
}

export default AppLauncher;
