import { AppBar, Box, Button, Card, CardActionArea, CardContent, Container, Grid, Toolbar, Typography } from "@mui/material";
import footerImage from "../assets/summary-neurons.png";
import { useGlobalContext } from "../contexts/GlobalContext.tsx";
import { parseURLParams } from "../helpers/parseURLHelper.ts";
import { TEMPLATE_ACTIVE_DATASETS, TEMPLATE_ACTIVE_NEURONS } from "../settings/templateWorkspaceSettings.ts";

function AppLauncher() {
  const { workspaces, createWorkspace, setCurrentWorkspace } = useGlobalContext();

  const handleTemplateClick = async () => {
    const workspaceId = `workspace-${Date.now()}`;
    const workspaceName = `Template Workspace ${Object.keys(workspaces).length + 1}`;

    createWorkspace(workspaceId, workspaceName, new Set(TEMPLATE_ACTIVE_DATASETS), new Set(TEMPLATE_ACTIVE_NEURONS));
    setCurrentWorkspace(workspaceId);
  };

  const handleBlankClick = () => {
    const workspaceId = `workspace-${Date.now()}`;
    const workspaceName = `Workspace ${Object.keys(workspaces).length + 1}`;

    createWorkspace(workspaceId, workspaceName);
    setCurrentWorkspace(workspaceId);
  };

  const handlePasteUrlClick = () => {
    const exampleURL = "http://localhost:8080/mode=default&ws_name=workspace1&ids=ADAL,AIBR,RIML&ws_name=workspace3&ids=RIFL,REMV&ws_name=test&ids=ADAL";

    const parsedParams = parseURLParams(exampleURL);
    console.log(parsedParams);
  };

  return (
    <>
      <Box>
        <AppBar component="nav">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }} />
            <Button color="secondary" variant="outlined">
              About Zhen Lab
            </Button>
          </Toolbar>
        </AppBar>
        <Box className="MuiBox-container">
          <Box className="MuiBox-title">
            <Typography variant="h3" component="h1" gutterBottom>
              Welcome to C. Elegans
            </Typography>
            <Typography variant="h6" component="p">
              Explore, query and visualize C. elegans datasets. To get started, choose from one of the options below.
            </Typography>
          </Box>
          <Container className="MuiContainer-center">
            <Grid container spacing={4} justifyContent="center">
              <Grid item xs={12} sm={6} md={4} display="flex">
                <Card>
                  <CardActionArea onClick={handleTemplateClick}>
                    <CardContent>
                      <Box>
                        <Typography variant="h4"> Start with a simple dataset</Typography>
                        <Typography className="success" variant="caption">
                          Simple
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        Start exploring the application without a particular dataset in mind. We’ll load a simple dataset for you to start exploring.
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4} display="flex">
                <Card>
                  <CardActionArea onClick={handleBlankClick}>
                    <CardContent>
                      <Box>
                        <Typography variant="h4">Blank canvas</Typography>
                        <Typography className="info" variant="caption">
                          Advanced
                        </Typography>
                      </Box>
                      <Typography variant="body2">Start with a blank canvas and select the datasets and neurons of your choice.</Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4} display="flex">
                <Card>
                  <CardActionArea onClick={handlePasteUrlClick}>
                    <CardContent>
                      <Box>
                        <Typography variant="h4">Paste URL</Typography>
                      </Box>
                      <Typography variant="body2">Paste URL from your pre-designed view or from one that your collaborators sent to you</Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Box textAlign="center">
                  <Button className="MuiButton-summary">Summary of available datasets and neurons</Button>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
        <Box px={2} className="MuiFooterImage">
          <img src={footerImage} alt="footerimage" width="100%" height="48" />
        </Box>
      </Box>
    </>
  );
}

export default AppLauncher;
