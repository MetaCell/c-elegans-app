import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { Box, CssBaseline } from "@mui/material";
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


function Workspace() {
  const dispatch = useDispatch();
  const { workspaces } = useGlobalContext();

  const workspaceId = useSelector((state: RootState) => state.workspaceId);
  const [LayoutComponent, setLayoutComponent] = useState<React.ComponentType | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const workspace = workspaces[workspaceId];

  useEffect(() => {
    if (LayoutComponent === undefined) {
      if (workspace.layoutManager) {
        setLayoutComponent(workspace.layoutManager.getComponent());
      }
    }
  }, [LayoutComponent, workspace.layoutManager]);

  useEffect(() => {
    dispatch(addWidget(threeDViewerWidget()));
    dispatch(addWidget(rightComponentWidget()));
  }, [LayoutComponent, dispatch]);

  const isLoading = LayoutComponent === undefined;
  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {!isLoading && (
          <Box
            className="layout-manager-container"
            sx={{
              padding: sidebarOpen
                ? "3.5rem .5rem .5rem 22.75rem"
                : "3.5rem .5rem .5rem 4.5rem",
            }}
          >
            <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <LayoutComponent />
          </Box>
        )}
      </ThemeProvider>
    </>
  );
}

export default Workspace;
