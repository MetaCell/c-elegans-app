import {Provider} from "react-redux";
import {ThemeProvider} from '@mui/material/styles';
import {Box, Button, CssBaseline, Typography} from "@mui/material";
import '@metacell/geppetto-meta-ui/flex-layout/style/dark.scss';
import theme from './theme/index.tsx';
import './App.css'
import {useGlobalContext} from "./contexts/GlobalContext.tsx";
import AppLauncher from "./components/AppLauncher.tsx";
import Workspace from "./components/Workspace.tsx";
import React from "react";
import {createEmptyWorkspace} from "./helpers/initialWorkspacesHelper.ts";
import {ViewMode} from "./models.ts";

function App() {
    const {
        workspaces,
        currentWorkspaceId,
        switchWorkspace,
        addWorkspace,
        viewMode,
        setViewMode,
        selectedWorkspacesIds,
        setSelectedWorkspacesIds
    } = useGlobalContext();


    const TEST_toggleViewMode = () => {
        if (viewMode === ViewMode.Default) {
            setViewMode(ViewMode.Compare);
            // Ensure at least two workspaces are selected for comparison
            const keys = Object.keys(workspaces);
            if (selectedWorkspacesIds.size < 2) {
                if (keys.length < 2) {
                    // Create a new workspace if there aren't enough
                    const newWorkspace = createEmptyWorkspace(`Workspace ${keys.length + 1}`);
                    addWorkspace(newWorkspace);
                    setSelectedWorkspacesIds(new Set([currentWorkspaceId, newWorkspace.id]));
                } else {
                    setSelectedWorkspacesIds(new Set([currentWorkspaceId, keys.find(key => key !== currentWorkspaceId)]));
                }
            }
        } else {
            setViewMode(ViewMode.Default);
            setSelectedWorkspacesIds(new Set([currentWorkspaceId]));
        }
    };
    const TEST_change_workspace = () => {

        const keys = Object.keys(workspaces);
        const otherKeys = keys.filter(key => key !== currentWorkspaceId);

        if (otherKeys.length > 0) {
            switchWorkspace(otherKeys[0]);
        } else {
            const newWorkspace = createEmptyWorkspace(`Workspace ${Object.keys(workspaces).length + 1}`);
            addWorkspace(newWorkspace);
            switchWorkspace(newWorkspace.id);
        }
    }

    const hasLaunched = currentWorkspaceId != undefined

    return (
        <>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                {hasLaunched ? (
                    <Box className={"layout-manager-container"}>
                        <Button variant="contained" color="primary" onClick={TEST_change_workspace}>
                            Change Workspace
                        </Button>
                        <Button variant="contained" color="secondary" onClick={TEST_toggleViewMode}>
                            Change View mode
                        </Button>
                        {viewMode === ViewMode.Compare ?
                            Array.from(selectedWorkspacesIds).map(id => (
                                <Provider key={id} store={workspaces[id].store}>
                                    <Workspace workspaceId={id}/>
                                </Provider>
                            ))
                            :
                            <Provider store={workspaces[currentWorkspaceId].store}>
                                <Workspace workspaceId={currentWorkspaceId}/>
                            </Provider>
                        }

                    </Box>

                ) : <AppLauncher/>}
            </ThemeProvider>
        </>
    )
}

export default App
