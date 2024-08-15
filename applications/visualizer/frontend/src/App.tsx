import { Box, CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { Provider } from "react-redux";
import theme from "./theme/index.tsx";
import "./App.css";
import React from "react";
import AppLauncher from "./components/AppLauncher.tsx";
import Layout from "./components/ViewerContainer/Layout.tsx";
import WorkspaceComponent from "./components/WorkspaceComponent.tsx";
import CompareWrapper from "./components/wrappers/Compare.tsx";
import DefaultWrapper from "./components/wrappers/Default.tsx";
import { useGlobalContext } from "./contexts/GlobalContext.tsx";
import { ViewMode } from "./models";

function App() {
  const { workspaces, currentWorkspaceId, viewMode, selectedWorkspacesIds } = useGlobalContext();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const hasLaunched = currentWorkspaceId !== undefined;

  const renderCompareMode = (workspaceIds: string[]) => (
    <CompareWrapper sidebarOpen={sidebarOpen}>
      {workspaceIds.map((id) => (
        <Provider key={id} store={workspaces[id].store}>
          <WorkspaceComponent sidebarOpen={sidebarOpen} />
        </Provider>
      ))}
    </CompareWrapper>
  );

  const renderDefaultMode = (currentWorkspaceId: string) => (
    <Provider store={workspaces[currentWorkspaceId].store}>
      <DefaultWrapper>
        <WorkspaceComponent sidebarOpen={sidebarOpen} />
      </DefaultWrapper>
    </Provider>
  );

  const renderWorkspaces = () => {
    if (viewMode === ViewMode.Compare) {
      return renderCompareMode(Array.from(selectedWorkspacesIds));
    }
    return renderDefaultMode(currentWorkspaceId as string);
  };

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {hasLaunched ? (
          <Box className={"layout-manager-container"}>
            <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            {renderWorkspaces()}
          </Box>
        ) : (
          <AppLauncher />
        )}
      </ThemeProvider>
    </>
  );
}

export default App;
