import {useDispatch} from "react-redux";
import React, {useEffect, useState} from "react";
import {ThemeProvider} from '@mui/material/styles';
import {Box, CircularProgress, CssBaseline} from "@mui/material";
import {addWidget} from '@metacell/geppetto-meta-client/common/layout/actions';
import '@metacell/geppetto-meta-ui/flex-layout/style/dark.scss';
import {rightComponentWidget} from "./layout-manager/widgets.ts";
import theme from './theme/index.tsx';
import './App.css'


function App2({layoutManager}) {

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
        dispatch(addWidget(rightComponentWidget()));
    }, [LayoutComponent, dispatch])


    const isLoading = LayoutComponent === undefined

    return (
        <>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                {isLoading ?
                    <CircularProgress/> :
                    <Box id="layout-manager-container">
                        <LayoutComponent/>
                    </Box>
                }
            </ThemeProvider>


        </>
    )
}

export default App2
