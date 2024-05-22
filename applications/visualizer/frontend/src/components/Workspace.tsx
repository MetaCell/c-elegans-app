import { useDispatch, useSelector } from "react-redux";
import React, { Suspense, useEffect, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { Box, CircularProgress, CssBaseline } from "@mui/material";
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
  
  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Suspense fallback={<CircularProgress />}>
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
        </Suspense>
      </ThemeProvider>
    </>
  );
}

export default Workspace;
