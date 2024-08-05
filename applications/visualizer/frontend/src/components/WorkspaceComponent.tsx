import { addWidget, updateWidget } from "@metacell/geppetto-meta-client/common/layout/actions";
import { Box, Button, CircularProgress, CssBaseline, Divider, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import React, { Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "@metacell/geppetto-meta-ui/flex-layout/style/light.scss";
import { useGlobalContext } from "../contexts/GlobalContext.tsx";
import type { RootState } from "../layout-manager/layoutManagerFactory.ts";
import { emDataViewerWidget, threeDViewerWidget, twoDViewerWidget } from "../layout-manager/widgets.ts";
import theme from "../theme";
import Layout from "./ViewerContainer/Layout.tsx";

import { WidgetStatus } from "@metacell/geppetto-meta-client/common/layout/model";
import { DeleteOutlined } from "@mui/icons-material";
import { AddIcon, CheckIcon, DownIcon, DownloadIcon, LinkIcon, ViewerSettings as ViewerSettingsIcon } from "../icons/index.tsx";
import { vars } from "../theme/variables.ts";
import CreateNewWorkspaceDialog from "./CreateNewWorkspaceDialog.tsx";
import ViewerSettings from "./ViewerSettings.tsx";

const { gray100, white, orange700 } = vars;

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
  const { workspaces, setCurrentWorkspace, removeWorkspace } = useGlobalContext();

  const workspaceId = useSelector((state: RootState) => state.workspaceId);
  const [LayoutComponent, setLayoutComponent] = useState<React.ComponentType>(() => LoadingComponent);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [showCreateWorkspaceDialog, setShowCreateWorkspaceDialog] = React.useState(false);
  const [hoveredWorkspaceId, setHoveredWorkspaceId] = useState(null);
  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  const currentWorkspace = workspaces[workspaceId];

  useEffect(() => {
    dispatch(addWidget(threeDViewerWidget()));
    dispatch(addWidget(twoDViewerWidget()));
    dispatch(addWidget(emDataViewerWidget()));
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
    setShowCreateWorkspaceDialog(true);
  };

  const onCloseCreateWorkspace = () => {
    setShowCreateWorkspaceDialog(false);
  };

  const onClickWorkspace = (workspace) => {
    setCurrentWorkspace(workspace.id);
  };

  const handleMouseEnter = (workspaceId) => {
    setHoveredWorkspaceId(workspaceId);
  };

  const handleMouseLeave = () => {
    setHoveredWorkspaceId(null);
  };

  const onDeleteWorkspace = (e, workspaceId) => {
    e.preventDefault();
    e.stopPropagation();

    const workspaceKeys = Object.keys(workspaces);
    const firstWorkspaceId = workspaces[workspaceKeys[0]].id;
    const secondWorkspaceId = workspaces[workspaceKeys[1]].id;

    // Determine the workspace to switch to after deletion
    const workspaceIdToView = workspaceId === firstWorkspaceId ? secondWorkspaceId : firstWorkspaceId;

    // If the current workspace is the one being deleted, switch to the determined workspace
    if (currentWorkspace.id === workspaceId) {
      setCurrentWorkspace(workspaceIdToView);
    }

    removeWorkspace(workspaceId);
  };

  const workspacesLength = Object.keys(workspaces).length;

  useEffect(() => {
    if (currentWorkspace.layoutManager) {
      setLayoutComponent(() => currentWorkspace.layoutManager.getComponent());
    }
  }, [currentWorkspace.layoutManager]);

  useEffect(() => {
    dispatch(addWidget(threeDViewerWidget()));
    dispatch(addWidget(twoDViewerWidget()));

    const updateWidgetStatus = (widget, viewerStatus) => {
      const status = viewerStatus ? WidgetStatus.ACTIVE : WidgetStatus.MINIMIZED;
      if (widget.status !== status) {
        dispatch(updateWidget({ ...widget, status }));
      }
    };

    updateWidgetStatus(threeDViewerWidget(), currentWorkspace.viewers["3D"]);
    updateWidgetStatus(twoDViewerWidget(), currentWorkspace.viewers["Graph"]);
  }, [LayoutComponent, dispatch, currentWorkspace.viewers]);

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
                        <MenuItem
                          disabled
                          sx={{
                            backgroundColor: "transparent !important",
                          }}
                        >
                          <Typography variant="h4">{"Workspaces"}</Typography>
                        </MenuItem>
                        <MenuItem sx={{ fontWeight: 600 }} onClick={onCreateWorkspaceClick}>
                          <AddIcon />
                          New workspace
                        </MenuItem>
                      </Box>
                      <Box>
                        {Object.keys(workspaces).map((workspace) => (
                          <MenuItem
                            key={workspaces[workspace].id}
                            value={workspaces[workspace].id}
                            onClick={() => onClickWorkspace(workspaces[workspace])}
                            onMouseEnter={() => handleMouseEnter(workspaces[workspace].id)}
                            onMouseLeave={handleMouseLeave}
                            sx={{
                              justifyContent: "space-between",
                            }}
                          >
                            <Box display="flex" alignItems="center" gap=".5rem">
                              <Box
                                sx={{
                                  visibility: currentWorkspace.id === workspaces[workspace].id ? "initial" : "hidden",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <CheckIcon />
                              </Box>
                              {workspaces[workspace].name}
                            </Box>
                            {hoveredWorkspaceId === workspaces[workspace].id && workspacesLength > 1 && (
                              <IconButton sx={{ p: 0 }} onClick={(e) => onDeleteWorkspace(e, workspaces[workspace].id)}>
                                <DeleteOutlined sx={{ color: orange700 }} />
                              </IconButton>
                            )}
                          </MenuItem>
                        ))}
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
            {showCreateWorkspaceDialog && (
              <CreateNewWorkspaceDialog onCloseCreateWorkspace={onCloseCreateWorkspace} showCreateWorkspaceDialog={showCreateWorkspaceDialog} />
            )}
          </Box>
        </Suspense>
      </ThemeProvider>
    </>
  );
}

export default WorkspaceComponent;
