import { Box, CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { Provider } from "react-redux";
import theme from "./theme/index.tsx";
import "./App.css";
import AppLauncher from "./components/AppLauncher.tsx";
import WorkspaceComponent from "./components/WorkspaceComponent.tsx";
import { useGlobalContext } from "./contexts/GlobalContext.tsx";
import { ViewMode } from "./models";

function App() {
  const { workspaces, currentWorkspaceId, viewMode, selectedWorkspacesIds } = useGlobalContext();

  const hasLaunched = currentWorkspaceId !== undefined;

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {hasLaunched ? (
          <Box className={"layout-manager-container"}>
            {viewMode === ViewMode.Compare ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  "& .layout-manager-container": {
                    "&:first-of-type": {
                      width: "60%",
                    },
                    "&:last-of-type": {
                      paddingLeft: 0,
                      width: "40%",
                    },
                  },
                }}
              >
                {Array.from(selectedWorkspacesIds).map((id) => (
                  <Provider key={id} store={workspaces[id].store}>
                    <WorkspaceComponent />
                  </Provider>
                ))}
              </Box>
            ) : (
              <Provider store={workspaces[currentWorkspaceId].store}>
                <WorkspaceComponent />
              </Provider>
            )}
          </Box>
        ) : (
          <AppLauncher />
        )}
      </ThemeProvider>
    </>
  );
}

export default App;
