import { useDispatch, useSelector } from "react-redux";
import React, { Suspense, useEffect, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { Box, Button, CircularProgress, CssBaseline, Divider, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { addWidget } from "@metacell/geppetto-meta-client/common/layout/actions";
import "@metacell/geppetto-meta-ui/flex-layout/style/dark.scss";
import theme from "../theme";
import { useGlobalContext } from "../contexts/GlobalContext.tsx";
import {
  rightComponentWidget,
  threeDViewerWidget,
} from "../layout-manager/widgets.ts";
import Layout from "./ViewerContainer/Layout.tsx";
import { RootState } from "../layout-manager/layoutManagerFactory.ts";
import { AddIcon, CheckIcon, DownIcon, DownloadIcon, LinkIcon, ViewerSettings as ViewerSettingsIcon } from "../icons/index.tsx";
import { vars } from "../theme/variables.ts";
import ViewerSettings from "./ViewerSettings.tsx";

const { gray100, white } = vars;

const LoadingComponent = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
    }}
  >
    <CircularProgress />
  </Box>
);

function Workspace() {
  const dispatch = useDispatch();
  const { workspaces } = useGlobalContext();

  const workspaceId = useSelector((state: RootState) => state.workspaceId);
  const [LayoutComponent, setLayoutComponent] = useState<React.ComponentType>(() => LoadingComponent);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  const workspace = workspaces[workspaceId];

  useEffect(() => {
    if (workspace.layoutManager) {
      setLayoutComponent(() => workspace.layoutManager.getComponent());
    }
  }, [workspace.layoutManager]);
  
  useEffect(() => {
    dispatch(addWidget(threeDViewerWidget()));
    dispatch(addWidget(rightComponentWidget()));
  }, [LayoutComponent, dispatch]);

  const [anchorElWorkspace, setAnchorElWorkspace] = React.useState<null | HTMLElement>(null);
  const openWorkspace = Boolean(anchorElWorkspace);
  const handleClickWorkspace = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElWorkspace(event.currentTarget);
  };
  const handleCloseWorkspace = () => {
    setAnchorElWorkspace(null);
  };
  
  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Suspense fallback={<CircularProgress />}>
          <Box
            className="layout-manager-container"
            sx={{
              padding: sidebarOpen
                ? "3.5rem 0 0 22.25rem"
                : "3.5rem 0 0 3.5rem",
            }}
          >
            <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Box p={1} height={1} display='flex'>
              <Box flex={1} borderRadius='0.25rem' border={`0.0625rem solid ${gray100}`} height={1} display='flex' flexDirection='column' sx={{background: white}}>
                <Box p={1.5} display='flex' alignItems='center' justifyContent='space-between' borderBottom={`0.0625rem solid ${gray100}`}>
                  <Box display='flex' alignItems='center' gap={0.5}>
                    <Button 
                      id="dataset-menu-btn"
                      aria-controls={openWorkspace ? 'Workspace-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={openWorkspace ? 'true' : undefined}
                      onClick={handleClickWorkspace}
                      endIcon={<DownIcon />}>Workspace 1</Button>
                    <Menu
                      sx={{
                        '& .MuiPaper-root': {
                          minWidth: '12.5rem'
                        }
                      }}
                      id="Workspace-menu"
                      anchorEl={anchorElWorkspace}
                      open={openWorkspace}
                      onClose={handleCloseWorkspace}
                      MenuListProps={{
                        'aria-labelledby': 'Workspace-menu-btn',
                      }}
                    >
                      <Box>
                        <MenuItem disabled>
                          <Typography variant="h4">{'Workspaces'}</Typography>
                        </MenuItem>
                        <MenuItem sx={{ fontWeight: 600 }}>
                          <AddIcon />
                          New workspace
                        </MenuItem>
                      </Box>
                      <Box>
                        <MenuItem>
                          {/* <CheckIcon /> */}
                          Workspace 1
                        </MenuItem>
                        <MenuItem>
                          <CheckIcon />
                          Workspace 2
                        </MenuItem>
                      </Box>
                    </Menu>
                    <Divider sx={{width: '0.0625rem', height: '1.9375rem', background: gray100}} />
                    <Box display='flex' alignItems='center' gap={0.5} px={1.5}>
                      <IconButton><LinkIcon /></IconButton>
                      <IconButton><DownloadIcon /></IconButton>
                    </Box>
                  </Box>
                  <Button variant="outlined" onClick={toggleDrawer(true)} startIcon={<ViewerSettingsIcon />}>Viewer settings</Button>
                  <ViewerSettings open={open} toggleDrawer={toggleDrawer} />
                </Box>
                <Box p={1.5} height={1} display='flex'><LayoutComponent /></Box>
              </Box>
            </Box>
          </Box>
        </Suspense>
      </ThemeProvider>
    </>
  );
}

export default Workspace;
