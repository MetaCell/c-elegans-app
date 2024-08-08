import { addWidget, updateWidget } from "@metacell/geppetto-meta-client/common/layout/actions";
import { Box, Button, CircularProgress, Divider, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import React, { Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import "@metacell/geppetto-meta-ui/flex-layout/style/light.scss";
import { WidgetStatus } from "@metacell/geppetto-meta-client/common/layout/model";
import { DeleteOutlined } from "@mui/icons-material";
import { useGlobalContext } from "../contexts/GlobalContext.tsx";
import { AddIcon, CheckIcon, DownIcon, DownloadIcon, LinkIcon, ViewerSettings as ViewerSettingsIcon } from "../icons/index.tsx";
import { setWorkspaceId } from "../layout-manager/actions.ts";
import type { RootState } from "../layout-manager/layoutManagerFactory.ts";
import { emDataViewerWidget, threeDViewerWidget, twoDViewerWidget } from "../layout-manager/widgets.ts";
import type { Workspace } from "../models";
import { ViewMode } from "../models";
import { ViewerType } from "../models/models.ts";
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

function WorkspaceComponent({ sidebarOpen }) {
  const dispatch = useDispatch();
  const { workspaces, setCurrentWorkspace, removeWorkspace, selectedWorkspacesIds, setSelectedWorkspacesIds, setAllWorkspaces, setViewMode, viewMode } =
    useGlobalContext();

  const workspaceId = useSelector((state: RootState) => state.workspaceId);
  const [LayoutComponent, setLayoutComponent] = useState<React.ComponentType>(() => LoadingComponent);
  const [open, setOpen] = React.useState(false);
  const [showCreateWorkspaceDialog, setShowCreateWorkspaceDialog] = React.useState(false);
  const [hoveredWorkspaceId, setHoveredWorkspaceId] = useState(null);
  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };
  const currentWorkspace = workspaces[workspaceId];
  const [workspace, setWorkspace] = useState(currentWorkspace);

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
    let updatedIds = Array.from(selectedWorkspacesIds);
    const index = updatedIds.indexOf(workspaceId);

    updatedIds = updateIds(updatedIds, index, workspace.id, viewMode);

    const newSelectedWorkspacesIds = new Set(updatedIds);
    setCurrentWorkspace(workspace.id);
    setWorkspace(workspaces[workspace.id]);
    setSelectedWorkspacesIds(newSelectedWorkspacesIds);

    // change the ordering of workspaces to put the selected on the top
    const selectedWorkspaces = Object.values(workspaces).filter((workspace) => newSelectedWorkspacesIds.has(workspace.id));
    const unselectedWorkspaces = Object.values(workspaces).filter((workspace) => !newSelectedWorkspacesIds.has(workspace.id));

    const sortedWorkspaces = [...selectedWorkspaces, ...unselectedWorkspaces];
    const sortedWorkspacesRecord = sortedWorkspaces.reduce(
      (acc, workspace) => {
        acc[workspace.id] = workspace;
        return acc;
      },
      {} as Record<string, Workspace>,
    );

    setAllWorkspaces(sortedWorkspacesRecord);
  };

  const updateIds = (ids, index, id, viewMode) => {
    if (index !== -1) {
      ids[index] = id;
    } else {
      if (viewMode === ViewMode.Compare) {
        ids.push(id);
      } else {
        ids = [id];
      }
    }
    return ids;
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
    const workspaceIndex = workspaceKeys.indexOf(workspaceId);

    let workspaceIdToView;

    if (workspaceKeys.length === 2) {
      workspaceIdToView = workspaceKeys.find((id) => id !== workspaceId);
      const updatedWorkspace = workspaces[workspaceIdToView];
      setCurrentWorkspace(workspaceIdToView);
      setWorkspace(updatedWorkspace);
      setAllWorkspaces({
        ...workspaces,
        [workspaceIdToView]: updatedWorkspace,
      });
      setViewMode(ViewMode.Default);
    } else {
      workspaceIdToView = workspaceKeys[(workspaceIndex + 1) % workspaceKeys.length];
      if (workspace.id === workspaceId) {
        setCurrentWorkspace(workspaceIdToView);
      }
    }

    const newSelectedWorkspacesIds = new Set(selectedWorkspacesIds);
    newSelectedWorkspacesIds.delete(workspaceId);

    setSelectedWorkspacesIds(newSelectedWorkspacesIds);
    removeWorkspace(workspaceId);
  };

  const workspacesLength = Object.keys(workspaces).length;

  useEffect(() => {
    if (workspace.layoutManager) {
      setLayoutComponent(() => workspace.layoutManager.getComponent());
    }
  }, [workspace.id, workspace.layoutManager]);

  useEffect(() => {
    if (workspace.id) {
      dispatch(addWidget(threeDViewerWidget()));
      dispatch(addWidget(twoDViewerWidget()));
      dispatch(addWidget(emDataViewerWidget()));

      const updateWidgetStatus = (widget, viewerStatus) => {
        const status = viewerStatus ? WidgetStatus.ACTIVE : WidgetStatus.MINIMIZED;
        if (widget.status !== status) {
          dispatch(updateWidget({ ...widget, status }));
        }
      };

      updateWidgetStatus(threeDViewerWidget(), workspace.viewers[ViewerType.ThreeD]);
      updateWidgetStatus(twoDViewerWidget(), workspace.viewers[ViewerType.Graph]);
      updateWidgetStatus(emDataViewerWidget(), workspace.viewers[ViewerType.EM]);
    }
  }, [workspace.id, workspace.viewers, dispatch, LayoutComponent]);

  useEffect(() => {
    dispatch(setWorkspaceId(workspace.id));
  }, [workspace.id]);

  return (
    <Suspense fallback={<CircularProgress />}>
      <Box
        className="layout-manager-container"
        sx={{
          padding: sidebarOpen ? "3.5rem 0 0 22.25rem" : "3.5rem 0 0 3.5rem",
        }}
      >
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
                    {Object.values(workspaces).map((workspace) => (
                      <MenuItem
                        key={workspace.id}
                        value={workspace.id}
                        onClick={() => onClickWorkspace(workspace)}
                        onMouseEnter={() => handleMouseEnter(workspace.id)}
                        onMouseLeave={handleMouseLeave}
                        sx={{
                          justifyContent: "space-between",
                          backgroundColor: "transparent !important",
                        }}
                        // disabled={Array.from(selectedWorkspacesIds).includes(workspace.id)}
                      >
                        <Box display="flex" alignItems="center" gap=".5rem">
                          <Box
                            sx={{
                              visibility: currentWorkspace.id === workspace.id ? "initial" : "hidden",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <CheckIcon />
                          </Box>
                          {workspace.name}
                        </Box>
                        {hoveredWorkspaceId === workspace.id && workspacesLength > 1 && (
                          <IconButton sx={{ p: 0 }} onClick={(e) => onDeleteWorkspace(e, workspace.id)}>
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
            </Box>
            <Box p={1.5} height={1} display="flex">
              <LayoutComponent />
              <ViewerSettings open={open} toggleDrawer={toggleDrawer} />
            </Box>
          </Box>
        </Box>
        {showCreateWorkspaceDialog && (
          <CreateNewWorkspaceDialog
            onCloseCreateWorkspace={onCloseCreateWorkspace}
            showCreateWorkspaceDialog={showCreateWorkspaceDialog}
            title="Create new workspace"
            subTitle={null}
            isCompareMode={false}
            submitButtonText={"Create workspace"}
          />
        )}
      </Box>
    </Suspense>
  );
}

export default WorkspaceComponent;
