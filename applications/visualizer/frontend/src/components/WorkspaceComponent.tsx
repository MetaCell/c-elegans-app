import { addWidget } from "@metacell/geppetto-meta-client/common/layout/actions";
import { Box, Button, CircularProgress, CssBaseline, Divider, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import React, { Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "@metacell/geppetto-meta-ui/flex-layout/style/light.scss";
import { useGlobalContext } from "../contexts/GlobalContext.tsx";
import type { RootState } from "../layout-manager/layoutManagerFactory.ts";
import { threeDViewerWidget, twoDViewerWidget } from "../layout-manager/widgets.ts";
import theme from "../theme";
import Layout from "./ViewerContainer/Layout.tsx";

import { AddIcon, CheckIcon, DownIcon, DownloadIcon, LinkIcon, ViewerSettings as ViewerSettingsIcon } from "../icons/index.tsx";
import { vars } from "../theme/variables.ts";
import ViewerSettings from "./ViewerSettings.tsx";
import CreateNewWorkspaceDialog from "./CreateNewWorkspaceDialog.tsx";

const { gray100, white } = vars;

const LoadingComponent = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100%",
    }}
  >
    <CircularProgress />
  </Box>
);

function WorkspaceComponent() {
  const dispatch = useDispatch();
  const { workspaces, setCurrentWorkspace } = useGlobalContext();

  const workspaceId = useSelector((state: RootState) => state.workspaceId);
  const [LayoutComponent, setLayoutComponent] = useState<React.ComponentType>(() => LoadingComponent);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [showCreateWorkspaceDialog, setShowCreateWorkspaceDialog] = React.useState(false)
  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  const currentWorkspace = workspaces[workspaceId];

  useEffect(() => {
    if (currentWorkspace.layoutManager) {
      setLayoutComponent(() => currentWorkspace.layoutManager.getComponent());
    }
  }, [currentWorkspace.layoutManager]);

  useEffect(() => {
    dispatch(addWidget(threeDViewerWidget()));
    dispatch(addWidget(twoDViewerWidget()));
  }, [LayoutComponent, dispatch]);

  const [anchorElWorkspace, setAnchorElWorkspace] = React.useState<null | HTMLElement>(null);
  const openWorkspace = Boolean(anchorElWorkspace);
  const handleClickWorkspace = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElWorkspace(event.currentTarget);
  };
  const handleCloseWorkspace = () => {
    setAnchorElWorkspace(null);
  };
  
  const onCreateWorkspaceClick = () => {
    setShowCreateWorkspaceDialog(true)
  };
  
  const onCloseCreateWorkspace = () => {
    setShowCreateWorkspaceDialog(false)
  }
  
  const onClickWorkspace = (workspace) => {
    setCurrentWorkspace(workspace.id)
  }

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Suspense fallback={<CircularProgress />}>
          <Box
            className="layout-manager-container"
            sx={{
              padding: sidebarOpen ? "3.5rem 0 0 22.25rem" : "3.5rem 0 0 3.5rem",
            }}
          >
            <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Box p={1} height={1} display="flex">
              <Box
                flex={1}
                borderRadius="0.25rem"
                border={`0.0625rem solid ${gray100}`}
                height={1}
                display="flex"
                flexDirection="column"
                sx={{ background: white }}
              >
                <Box p={1.5} display="flex" alignItems="center" justifyContent="space-between" borderBottom={`0.0625rem solid ${gray100}`}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Button
                      id="dataset-menu-btn"
                      aria-controls={openWorkspace ? "Workspace-menu" : undefined}
                      aria-haspopup="true"
                      aria-expanded={openWorkspace ? "true" : undefined}
                      onClick={handleClickWorkspace}
                      endIcon={<DownIcon />}
                    >
                      {currentWorkspace.name}
                    </Button>
                    <Menu
                      sx={{
                        "& .MuiPaper-root": {
                          width: "15.625rem",
                        },
                      }}
                      id="Workspace-menu"
                      anchorEl={anchorElWorkspace}
                      open={openWorkspace}
                      onClose={handleCloseWorkspace}
                      MenuListProps={{
                        "aria-labelledby": "Workspace-menu-btn",
                      }}
                    >
                      <Box>
                        <MenuItem disabled sx={{
                          backgroundColor: 'transparent !important',
                        }}>
                          <Typography variant="h4">{"Workspaces"}</Typography>
                        </MenuItem>
                        <MenuItem sx={{ fontWeight: 600 }} onClick={onCreateWorkspaceClick}>
                          <AddIcon />
                          New workspace
                        </MenuItem>
                      </Box>
                      <Box
                      >
                        {
                          Object.keys(workspaces).map(workspace => <MenuItem key={workspaces[workspace].id} value={workspaces[workspace].id} onClick={() => onClickWorkspace(workspaces[workspace])}>
                            <Box sx={{
                              visibility: currentWorkspace.id === workspaces[workspace].id ? 'block' : 'hidden'
                            }}>
                              <CheckIcon />
                            </Box>
                            {workspaces[workspace].name}
                          </MenuItem>)
                        }
                      </Box>
                    </Menu>
                    <Divider sx={{ width: "0.0625rem", height: "1.9375rem", background: gray100 }} />
                    <Box display="flex" alignItems="center" gap={0.5} px={1.5}>
                      <IconButton>
                        <LinkIcon />
                      </IconButton>
                      <IconButton>
                        <DownloadIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Button variant="outlined" onClick={toggleDrawer(true)} startIcon={<ViewerSettingsIcon />}>
                    Viewer settings
                  </Button>
                  <ViewerSettings open={open} toggleDrawer={toggleDrawer} />
                </Box>
                <Box p={1.5} height={1} display="flex">
                  <LayoutComponent />
                </Box>
              </Box>
            </Box>
            {
              showCreateWorkspaceDialog && <CreateNewWorkspaceDialog onCloseCreateWorkspace={onCloseCreateWorkspace} showCreateWorkspaceDialog={showCreateWorkspaceDialog} />
            }
          </Box>
        </Suspense>
      </ThemeProvider>
    </>
  );
}

export default WorkspaceComponent;
