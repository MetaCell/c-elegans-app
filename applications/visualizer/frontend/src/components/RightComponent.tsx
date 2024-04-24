import {Box, Button, List, ListItem, ListItemText, Typography} from "@mui/material";
import {useGlobalContext} from "../contexts/GlobalContext.tsx";
import {
    activateDataset,
    activateNeuron,
    changeViewerVisibility,
    deactivateDataset,
    deactivateNeuron, highlightNeuron, updateViewerSynchronizationStatus
} from "../helpers/workspacesHelper.ts";
import {ViewerSynchronizationPair, ViewerType} from "../models.ts";
import {useSelector} from "react-redux";


export default function RightComponent() {
    const {workspaces, updateWorkspace, datasets, neurons} = useGlobalContext();
    const workspaceId = useSelector(state => state.workspaceId);

    const workspace = workspaces[workspaceId];

    function withWorkspaceUpdate(modifyWorkspace) {
        return function (...args) {
            const updatedWorkspace = modifyWorkspace(workspace, ...args);
            updateWorkspace(workspace.id, updatedWorkspace);
            return updatedWorkspace;
        };
    }

    const addNeuronAndUpdate = withWorkspaceUpdate(activateNeuron);
    const removeNeuronAndUpdate = withWorkspaceUpdate(deactivateNeuron);
    const addDatasetAndUpdate = withWorkspaceUpdate(activateDataset);
    const removeDatasetAndUpdate = withWorkspaceUpdate(deactivateDataset);
    const toggleViewerVisibility = withWorkspaceUpdate(changeViewerVisibility);
    const toggleSyncStatus = withWorkspaceUpdate(updateViewerSynchronizationStatus);
    const highlightNeuronAndUpdate = withWorkspaceUpdate(highlightNeuron);


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
                <Button variant="contained" color="primary" onClick={() => addNeuronAndUpdate(testNeuron)}>
                    Activate Neuron
                </Button>
                <Button variant="contained" color="error"
                        onClick={() => removeNeuronAndUpdate(testNeuron)}>
                    Deactivate Neuron
                </Button>
                <Button variant="contained" color="primary" onClick={() => addDatasetAndUpdate(testDataset)}>
                    Activate Dataset
                </Button>
                <Button variant="contained" color="error"
                        onClick={() => removeDatasetAndUpdate(testDataset)}>
                    Deactivate Dataset
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => toggleViewerVisibility(viewerToToggle, !currentVisibility)}
                >
                    Toggle {ViewerType.Graph} Viewer
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => toggleSyncStatus(syncPair, !currentSyncStatus)}
                >
                    Toggle Synchronization {syncPair}
                </Button>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => highlightNeuronAndUpdate(testNeuron)}
                >
                    Highlight Neuron
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
                {Array.from(workspace.datasets).map((id) => (
                    <ListItem key={id}>
                        <ListItemText primary={`Name: ${datasets[id]?.name || "Not found"}`}/>
                    </ListItem>
                ))}
            </List>

            <Typography variant="subtitle2">Neurons:</Typography>
            <List>
                {Array.from(workspace.neurons).map((id, index) => (
                    <ListItem key={id}>
                        <ListItemText primary={`Label: ${neurons[id]?.name || "Not found"}`}/>
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