import {useDispatch} from "react-redux";
import React, {useEffect, useState} from "react";
import {ThemeProvider} from '@mui/material/styles';
import {Box, Button, CircularProgress, CssBaseline, Typography} from "@mui/material";
import {addWidget} from '@metacell/geppetto-meta-client/common/layout/actions';
import '@metacell/geppetto-meta-ui/flex-layout/style/dark.scss';
import {leftComponentWidget, rightComponentWidget} from "../layout-manager/widgets.ts";
import theme from '../theme';
import {useGlobalContext} from "../contexts/GlobalContext.tsx";
import {createEmptyWorkspace} from "../helpers/initialWorkspacesHelper.ts";


function Workspace({workspaceId}) {


    const dispatch = useDispatch();
    const [LayoutComponent, setLayoutComponent] = useState<React.ComponentType | undefined>(undefined);

    const {workspaces, switchWorkspace, addWorkspace} = useGlobalContext();

    const workspace = workspaces[workspaceId]

    useEffect(() => {
        if (LayoutComponent === undefined) {
            if (workspace.layoutManager) {
                setLayoutComponent(workspace.layoutManager.getComponent());
            }
        }
    }, [LayoutComponent])

    useEffect(() => {
        dispatch(addWidget(leftComponentWidget()));
        dispatch(addWidget(rightComponentWidget()));
    }, [LayoutComponent, dispatch])

    const TEST_change_workspace = () => {
        const keys = Object.keys(workspaces);
        const otherKeys = keys.filter(key => key !== workspaceId);

        if (otherKeys.length > 0) {
            switchWorkspace(otherKeys[0]);
        } else {
            const newWorkspace = createEmptyWorkspace(`Workspace ${Object.keys(workspaces).length + 1}`);
            addWorkspace(newWorkspace);
            switchWorkspace(newWorkspace.id);
        }
    }

    const isLoading = LayoutComponent === undefined
    return (
        <>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                {isLoading ?
                    <CircularProgress/> :
                    <Box className="layout-manager-container">
                        <Typography variant="h6">
                            {workspace.name}
                        </Typography>
                        <Button variant="contained" color="primary" onClick={TEST_change_workspace}>
                            Change Workspace
                        </Button>
                        <LayoutComponent/>
                    </Box>
                }
            </ThemeProvider>
        </>
    )
}

export default Workspace
