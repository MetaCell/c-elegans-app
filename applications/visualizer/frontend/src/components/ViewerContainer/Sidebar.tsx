import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, Button, DialogActions, DialogContent, Divider, Drawer, Stack, Typography } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import type { CSSObject, Theme } from "@mui/material/styles";
import React, { useState, useCallback } from "react";
import { useGlobalContext } from "../../contexts/GlobalContext.tsx";
import { DataSetsIcon, LogoIcon, NeuronsIcon } from "../../icons";
import { ViewMode } from "../../models";
import { vars } from "../../theme/variables.ts";
import CustomDialog from "../CustomDialog.tsx";
import DataSets from "./DataSets.tsx";
import Neurons from "./Neurons.tsx";
import WorkspaceSelector from "./WorkspaceSelector";

const { gray100, gray50 } = vars;

const openedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflow: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflow: "hidden",
  width: "3.5rem",
});
const DrawerHeader = ({
  drawerHeight,
}: {
  drawerHeight: string;
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const { setAllWorkspaces, setCurrentWorkspace, setSelectedWorkspacesIds, setViewMode, removeWorkspace, currentWorkspaceId } = useGlobalContext();

  const handleReset = useCallback(() => {
    setAllWorkspaces({});
    setCurrentWorkspace(undefined);
    setSelectedWorkspacesIds(new Set());
    setViewMode(ViewMode.Default);
    removeWorkspace(currentWorkspaceId);
    setOpenDialog(false);
  }, [setAllWorkspaces, setCurrentWorkspace, setSelectedWorkspacesIds, setViewMode, removeWorkspace, currentWorkspaceId]);

  const handleLogoClick = useCallback(() => {
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);

  return (
    <>
      <Box
        sx={{
          height: drawerHeight,
          borderBottom: `0.0625rem solid ${gray100}`,
        }}
      >
        <Box
          sx={{
            width: "3.5rem",
            borderRight: `0.0625rem solid ${gray100}`,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: ".75rem",
          }}
        >
          <IconButton
            onClick={handleLogoClick}
            sx={{
              padding: "0",
            }}
          >
            <LogoIcon />
          </IconButton>
        </Box>
      </Box>

      <CustomDialog showModal={openDialog} onClose={handleCloseDialog} title="Your data will not be saved">
        <DialogContent>
          <Stack spacing={1}>
            <Typography variant="subtitle2">Are you sure you want to exit?</Typography>
            <Typography variant="body1">Your data will not be saved upon exiting the viewer. Are you sure?</Typography>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: `0.0625rem solid ${gray100}`,
            px: "1rem",
            py: "0.75rem",
            gap: 0.5,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleReset} color="info" variant="contained">
            Exit anyway
          </Button>
        </DialogActions>
      </CustomDialog>
    </>
  );
};
const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  drawerHeight,
  drawerWidth,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  drawerHeight: string;
  drawerWidth: string;
}) => {
  const { setCurrentWorkspace, viewMode } = useGlobalContext();

  const [content, setContent] = useState("dataSets");

  const [anchorElWorkspace, setAnchorElWorkspace] = React.useState<null | HTMLElement>(null);
  const openWorkspace = Boolean(anchorElWorkspace);

  const handleClickWorkspace = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElWorkspace(event.currentTarget);
  };
  const handleCloseWorkspace = () => {
    setAnchorElWorkspace(null);
  };

  const onClickWorkspace = (workspace) => {
    setCurrentWorkspace(workspace.id);
  };

  const handleDrawerOpen = () => {
    setSidebarOpen(true);
  };

  const handleDrawerClose = () => {
    setSidebarOpen(false);
  };

  const handleToggleContent = (_, type) => {
    setContent(type);
  };

  return (
    <Drawer
      variant="permanent"
      sx={(theme) => ({
        flexShrink: 0,
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        "& .MuiPaper-root": {
          borderColor: gray100,
          height: "100vh",
          paddingBottom: "0",
        },
        ...(sidebarOpen && {
          ...openedMixin(theme),
          width: drawerWidth,
          "& .MuiDrawer-paper": { ...openedMixin(theme), width: drawerWidth },
        }),
        ...(!sidebarOpen && {
          ...closedMixin(theme),
          "& .MuiDrawer-paper": {
            ...closedMixin(theme),
          },
        }),
      })}
    >
      <DrawerHeader drawerHeight={drawerHeight} />
      <Box
        sx={{
          display: "flex",
          height: "calc(100vh - 4rem)",
          overflow: "hidden",
        }}
      >
        <Stack spacing=".75rem" borderRight={`0.0625rem solid ${gray100}`} p=".75rem" width="3.5rem" justifyContent="space-between">
          <Stack spacing=".75rem">
            <IconButton
              sx={{
                padding: ".38rem",
                borderRadius: content === "dataSets" ? "0.5rem" : "initial",
                background: content === "dataSets" ? gray50 : "initial",
                "&:hover": {
                  borderRadius: "0.5rem",
                  background: gray50,
                },
              }}
              onClick={(e) => handleToggleContent(e, "dataSets")}
            >
              <DataSetsIcon />
            </IconButton>
            <IconButton
              sx={{
                padding: ".38rem",
                borderRadius: content === "neurons" ? "0.5rem" : "initial",
                background: content === "neurons" ? gray50 : "initial",
                "&:hover": {
                  borderRadius: "0.5rem",
                  background: gray50,
                },
              }}
              onClick={(e) => handleToggleContent(e, "neurons")}
            >
              <NeuronsIcon />
            </IconButton>
          </Stack>
          <IconButton
            onClick={sidebarOpen ? handleDrawerClose : handleDrawerOpen}
            sx={{
              padding: ".38rem",
              background: "transparent",
              "&:hover": {
                background: gray50,
              },
            }}
          >
            {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        </Stack>
        {sidebarOpen && (
          <>
            {content === "dataSets" ? (
              <DataSets>
                {viewMode === ViewMode.Compare && (
                  <>
                    <Divider />
                    <WorkspaceSelector
                      anchorElWorkspace={anchorElWorkspace}
                      openWorkspace={openWorkspace}
                      handleClickWorkspace={handleClickWorkspace}
                      handleCloseWorkspace={handleCloseWorkspace}
                      onClickWorkspace={onClickWorkspace}
                    />
                  </>
                )}
              </DataSets>
            ) : (
              <Neurons>
                {viewMode === ViewMode.Compare && (
                  <>
                    <Divider />
                    <WorkspaceSelector
                      anchorElWorkspace={anchorElWorkspace}
                      openWorkspace={openWorkspace}
                      handleClickWorkspace={handleClickWorkspace}
                      handleCloseWorkspace={handleCloseWorkspace}
                      onClickWorkspace={onClickWorkspace}
                    />
                  </>
                )}
              </Neurons>
            )}
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
