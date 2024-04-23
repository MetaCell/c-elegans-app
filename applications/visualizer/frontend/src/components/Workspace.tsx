import {useDispatch} from "react-redux";
import React, {useEffect, useState} from "react";
import {ThemeProvider} from '@mui/material/styles';
import {Box, CircularProgress, CssBaseline} from "@mui/material";
import {addWidget} from '@metacell/geppetto-meta-client/common/layout/actions';
import '@metacell/geppetto-meta-ui/flex-layout/style/dark.scss';
import {leftComponentWidget, rightComponentWidget} from "../layout-manager/widgets.ts";
import theme from '../theme';
import {useGlobalContext} from "../contexts/GlobalContext.tsx";


function Workspace({workspaceId}) {


    const dispatch = useDispatch();
    const [LayoutComponent, setLayoutComponent] = useState<React.ComponentType | undefined>(undefined);

    const {workspaces} = useGlobalContext();

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


    const isLoading = LayoutComponent === undefined
    return (
        <>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                {isLoading ?
                    <CircularProgress/> :
                    <Box className="layout-manager-container">
                        <LayoutComponent/>
                    </Box>
                }
            </ThemeProvider>
        </>
    )
}

export default Workspace
