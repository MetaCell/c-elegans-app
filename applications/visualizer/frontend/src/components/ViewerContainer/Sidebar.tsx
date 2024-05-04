import { CSSObject, Theme } from "@mui/material/styles";
import { Box, Drawer, Stack } from "@mui/material";
import { vars } from "../../theme/variables.ts";
import IconButton from "@mui/material/IconButton";
import { DataSetsIcon, NeuronsIcon, SidebarExpandIcon } from "../../icons";
import { useState } from "react";
import DataSets from "./DataSets.tsx";
import Neurons from "./Neurons.tsx";

const { gray100, white, gray200, gray50, buttonShadow } = vars;

const openedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `3.5rem`,
});
const DrawerHeader = ({
  sidebarOpen,
  handleDrawerClose,
  handleDrawerOpen,
  drawerHeight,
}: {
  sidebarOpen: boolean;
  handleDrawerClose: () => void;
  handleDrawerOpen: () => void;
  drawerHeight: string;
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      padding: ".75rem",
      height: drawerHeight,
      borderBottom: `1px solid ${gray100}`,
    }}
  >
    <IconButton
      onClick={sidebarOpen ? handleDrawerClose : handleDrawerOpen}
      sx={{
        padding: ".38rem",
        borderRadius: "0.375rem",
        border: `1px solid ${white}`,
        "&:hover": {
          background: gray50,
        },
        ...(sidebarOpen && {
          borderColor: gray200,
          background: gray50,
          boxShadow: buttonShadow,
        }),
      }}
    >
      <SidebarExpandIcon />
    </IconButton>
  </Box>
);
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
  const [content, setContent] = useState("dataSets");
  const handleDrawerOpen = () => {
    setSidebarOpen(true);
  };

  const handleDrawerClose = () => {
    setSidebarOpen(false);
  };

  const handleToggleContent = (e, type) => {
    setContent(type);
  };
  return (
    <Drawer
      variant="permanent"
      sx={(theme) => ({
        flexShrink: 0,
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        zIndex: 20000,
        "& .MuiPaper-root": {
          borderColor: gray100,
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
      <DrawerHeader
        sidebarOpen={sidebarOpen}
        handleDrawerClose={handleDrawerClose}
        handleDrawerOpen={handleDrawerOpen}
        drawerHeight={drawerHeight}
      />
      <Box
        sx={{
          display: "flex",
        }}
        height={1}
      >
        <Stack spacing=".75rem" borderRight={`1px solid ${gray100}`} p=".75rem">
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
        {sidebarOpen && (
          <Box
            sx={{
              padding: ".75rem",
            }}
          >
            {content === "dataSets" ? <DataSets /> : <Neurons />}
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
