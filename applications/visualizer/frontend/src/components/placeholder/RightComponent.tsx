import {Box, Button, List, ListItem, ListItemText, Typography} from "@mui/material";
import {useGlobalContext} from "../../contexts/GlobalContext.tsx";
import {ViewerSynchronizationPair, ViewerType} from "../../models/models.ts";
import {useSelector} from "react-redux";
import {Workspace} from "../../models/workspace.ts";
import {RootState} from "../../layout-manager/layoutManagerFactory.ts";


export default function RightComponent() {
    const {workspaces} = useGlobalContext();
    const workspaceId = useSelector((state:RootState) => state.workspaceId);

    const workspace : Workspace = workspaces[workspaceId];


    if (!workspace) {
        return (
            <Box>
                <Typography variant="h6">No active workspace selected</Typography>
            </Box>
        );
    }

    const viewerToToggle = ViewerType.Graph;
    const currentVisibility = workspace.viewers[viewerToToggle];
    const syncPair = ViewerSynchronizationPair.Graph_InstanceDetails;
    const currentSyncStatus = workspace.synchronizations[syncPair];
    const testNeuron = 'ADAL'
    const testDataset = "white_1986_jse"

    return (
        <Box>
            <Typography variant="h1">Material + Layout-Manager</Typography>
            <Typography variant="h6">Workspace Details:</Typography>
            <Typography variant="subtitle1">Name: {workspace.name}</Typography>


            <Box>
                <Button variant="contained" color="primary" onClick={() => workspace.activateNeuron(testNeuron)}>
                    Activate Neuron
                </Button>
                <Button variant="contained" color="error"
                        onClick={() => workspace.deactivateNeuron(testNeuron)}>
                    Deactivate Neuron
                </Button>
                <Button variant="contained" color="primary" onClick={() => workspace.activateDataset(testDataset)}>
                    Activate Dataset
                </Button>
                <Button variant="contained" color="error"
                        onClick={() => workspace.deactivateDataset(testDataset)}>
                    Deactivate Dataset
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => workspace.changeViewerVisibility(viewerToToggle, !currentVisibility)}
                >
                    Toggle {ViewerType.Graph} Viewer
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => workspace.updateViewerSynchronizationStatus(syncPair, !currentSyncStatus)}
                >
                    Toggle Synchronization {syncPair}
                </Button>
            </Box>

            <Typography variant="subtitle2">Viewers:</Typography>
            <List>
                {Object.entries(workspace.viewers).map(([type, isVisible]) => (
                    <ListItem key={type}>
                        <ListItemText primary={`${type}: ${isVisible}`}/>
                    </ListItem>
                ))}
            </List>

            <Typography variant="subtitle2">Datasets:</Typography>
            <List>
                {Array.from(workspace.activeDatasets).map((id) => (
                    <ListItem key={id}>
                        <ListItemText primary={`${id}`}/>
                    </ListItem>
                ))}
            </List>

            <Typography variant="subtitle2">Neurons:</Typography>
            <List>
                {Array.from(workspace.activeNeurons).map((id) => (
                    <ListItem key={id}>
                        <ListItemText primary={`${id}`}/>
                    </ListItem>
                ))}
            </List>

            <Typography variant="subtitle2">Synchronization:</Typography>
            <List>
                {Object.entries(workspace.synchronizations).map(([pair, isActive]) => (
                    <ListItem key={pair}>
                        <ListItemText primary={`${pair}: ${isActive}`}/>
                    </ListItem>
                ))}
            </List>

            <Typography variant="subtitle2">Highlighted Neuron: {workspace.highlightedNeuron || "None"}</Typography>


        </Box>
    );
}