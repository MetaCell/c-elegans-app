import {useDispatch} from "react-redux";
import React, {useEffect, useState} from "react";
import {ThemeProvider} from '@mui/material/styles';
import {Box, CircularProgress, CssBaseline} from "@mui/material";
import {addWidget} from '@metacell/geppetto-meta-client/common/layout/actions';
import '@metacell/geppetto-meta-ui/flex-layout/style/dark.scss';
import {leftComponentWidget, rightComponentWidget} from "../layout-manager/widgets.ts";
import theme from '../theme';


function Workspace({layoutManager}) {

    const dispatch = useDispatch();
    const [LayoutComponent, setLayoutComponent] = useState<React.ComponentType | undefined>(undefined);

    useEffect(() => {
        if (LayoutComponent === undefined) {
            if (layoutManager) {
                setLayoutComponent(layoutManager.getComponent());
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
