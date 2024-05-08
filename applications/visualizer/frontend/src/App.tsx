import { Provider } from "react-redux";
import { ThemeProvider } from '@mui/material/styles';
import { Box, CssBaseline } from "@mui/material";
import '@metacell/geppetto-meta-ui/flex-layout/style/dark.scss';
import theme from './theme/index.tsx';
import './App.css'
import { useGlobalContext } from "./contexts/GlobalContext.tsx";
import AppLauncher from "./components/AppLauncher.tsx";
import Workspace from "./components/Workspace.tsx";
import { ViewMode } from "./models/models.ts";

function App() {
    const {
        workspaces,
        currentWorkspaceId,
        viewMode,
        selectedWorkspacesIds,
    } = useGlobalContext();


    const hasLaunched = currentWorkspaceId != undefined

    return (
        <>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {hasLaunched ? (
                    <Box className={"layout-manager-container"}>
                        {viewMode === ViewMode.Compare ?
                            Array.from(selectedWorkspacesIds).map(id => (
                                <Provider key={id} store={workspaces[id].store}>
                                    <Workspace />
                                </Provider>
                            ))
                            :
                            <Provider store={workspaces[currentWorkspaceId].store}>
                                <Workspace />
                            </Provider>
                        }

                    </Box>

                ) : <AppLauncher />}
            </ThemeProvider>
        </>
    )
}

export default App
