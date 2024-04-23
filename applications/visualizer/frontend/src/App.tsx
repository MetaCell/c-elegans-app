import {Provider} from "react-redux";
import {ThemeProvider} from '@mui/material/styles';
import {CssBaseline} from "@mui/material";
import '@metacell/geppetto-meta-ui/flex-layout/style/dark.scss';
import theme from './theme/index.tsx';
import './App.css'
import {useGlobalContext} from "./contexts/GlobalContext.tsx";
import AppLauncher from "./components/AppLauncher.tsx";
import Workspace from "./components/Workspace.tsx";

function App() {
    const {workspaces, currentWorkspaceId} = useGlobalContext();

    const hasLaunched = currentWorkspaceId != undefined

    return (
        <>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                {hasLaunched ? (
                    <Provider store={workspaces[currentWorkspaceId].store}>
                        <Workspace layoutManager={workspaces[currentWorkspaceId].layoutManager}/>
                    </Provider>
                ) : <AppLauncher/>}
            </ThemeProvider>
        </>
    )
}

export default App
