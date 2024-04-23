import {Box, Button, List, ListItem, ListItemText, Typography} from "@mui/material";
import {useGlobalContext} from "../contexts/GlobalContext.tsx";
import {activateNeuron, deactivateNeuron} from "../helpers/workspacesHelper.ts";


const testNeuron = {id: 'neuron3', label: 'Neuron 3'};

export default function RightComponent() {
    const {workspaces, currentWorkspaceId, updateWorkspace} = useGlobalContext();
    const workspace = workspaces[currentWorkspaceId];

    function withWorkspaceUpdate(modifyWorkspace) {
        return function (workspace, ...args) {
            const updatedWorkspace = modifyWorkspace(workspace, ...args);
            updateWorkspace(workspace.id, updatedWorkspace);
            return updatedWorkspace;
        };
    }

    const addNeuronAndUpdate = withWorkspaceUpdate(activateNeuron);
    const removeNeuronAndUpdate = withWorkspaceUpdate(deactivateNeuron);

    if (!workspace) {
        return (
            <Box>
                <Typography variant="h6">No active workspace selected</Typography>
            </Box>
        );
    }


    return (
        <Box>
            <Typography variant="h1">Material + Layout-Manager</Typography>
            <Typography variant="h6">Workspace Details:</Typography>
            <Typography variant="subtitle1">Name: {workspace.name}</Typography>


            <Box>
                <Button variant="contained" color="primary" onClick={() => addNeuronAndUpdate(workspace, testNeuron)}>
                    Add Neuron
                </Button>
                <Button variant="contained" color="error"
                        onClick={() => removeNeuronAndUpdate(workspace, testNeuron.id)}>
                    Remove Neuron
                </Button>
            </Box>

            <Typography variant="subtitle2">Viewers:</Typography>
            <List>
                {Object.entries(workspace.viewers).map(([id, viewer]) => (
                    <ListItem key={id}>
                        <ListItemText primary={`Type: ${viewer.type}`} secondary={`Visible: ${viewer.isVisible}`}/>
                    </ListItem>
                ))}
            </List>

            <Typography variant="subtitle2">Datasets:</Typography>
            <List>
                {Object.entries(workspace.datasets).map(([id, dataset]) => (
                    <ListItem key={id}>
                        <ListItemText primary={`Name: ${dataset.name}`}/>
                    </ListItem>
                ))}
            </List>

            <Typography variant="subtitle2">Neurons:</Typography>
            <List>
                {Object.entries(workspace.neurons).map(([id, neuron]) => (
                    <ListItem key={id}>
                        <ListItemText primary={`Label: ${neuron.label}`}/>
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

        </Box>
    );
}