import CustomDialog from "./CustomDialog.tsx";
import { useEffect, useState } from "react";
import { Box, Button, FormLabel, IconButton, TextField, Typography } from "@mui/material";
import CustomAutocomplete from "./CustomAutocomplete.tsx";
import { Neuron, Dataset } from "../models";
import { CaretIcon, CheckIcon, CloseIcon } from "../icons";
import { NeuronsService } from "../rest";
import { useGlobalContext } from "../contexts/GlobalContext.tsx";
import { vars as colors } from "../theme/variables.ts";
import { v4 as uuidv4 } from 'uuid';
const CreateNewWorkspaceDialog = ({ onCloseCreateWorkspace, showCreateWorkspaceDialog }) => {
  const [neurons, setNeurons] = useState<Neuron[]>([]);
  const { datasets, createWorkspace } = useGlobalContext();
  
  const [formValues, setFormValues] = useState<{
    workspaceName: string;
    selectedDatasets: Dataset[];
    selectedNeurons: Neuron[];
  }>({
    workspaceName: '',
    selectedDatasets: [],
    selectedNeurons: []
  });
  
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const fetchNeurons = async () => {
    try {
      const response = await NeuronsService.getAllCells({ page: 1 });
      setNeurons(response.items);
    } catch (error) {
      console.error("Failed to fetch datasets", error);
    }
  };
  
  useEffect(() => {
    fetchNeurons();
  }, []);
  
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues({ ...formValues, [name]: value });
    if (name === "workspaceName" && errorMessage) {
      setErrorMessage('');
    }
  };
  
  const handleDatasetChange = (value) => {
    setFormValues({ ...formValues, selectedDatasets: value });
  };
  
  const handleNeuronChange = (value) => {
    setFormValues({ ...formValues, selectedNeurons: value });
  };
  
  const handleSubmit = () => {
    if (!formValues.workspaceName.trim()) {
      setErrorMessage('Workspace name is required.');
      return;
    }
    
    const randomNumber = uuidv4().replace(/\D/g, '').substring(0, 13);
    const newWorkspaceId = `workspace-${randomNumber}`;
    const activeNeurons = new Set(formValues.selectedNeurons.map(neuron => neuron.name));
    const activeDatasets = new Set(formValues.selectedDatasets.map(dataset => dataset.name));
    createWorkspace(newWorkspaceId, formValues.workspaceName, activeDatasets, activeNeurons);
    onCloseCreateWorkspace();
  };
  
  return (
    <CustomDialog onClose={onCloseCreateWorkspace} showModal={showCreateWorkspaceDialog} title={'Create New workspace'}>
      <Box px="1rem" py="1.5rem" gap={2.5} display="flex" flexDirection="column">
        <Box>
          <FormLabel>Workspace name <Typography variant='caption'>(REQUIRED)</Typography></FormLabel>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Start typing workspace name"
            name="workspaceName"
            value={formValues.workspaceName}
            onChange={handleInputChange}
            error={!!errorMessage}
            helperText={errorMessage}
          />
        </Box>
        
        <Box>
          <FormLabel>Datasets</FormLabel>
          <CustomAutocomplete
            options={datasets}
            getOptionLabel={(option) => option.name}
            renderOption={(props, option) => (
              <li {...props}>
                <CheckIcon />
                <Typography>{option.name}</Typography>
              </li>
            )}
            placeholder="Start typing to search"
            id="grouped-demo"
            popupIcon={<CaretIcon />}
            ChipProps={{
              deleteIcon: (
                <IconButton sx={{ p: "0 !important", margin: "0 !important" }}>
                  <CloseIcon />
                </IconButton>
              ),
            }}
            value={formValues.selectedDatasets}
            onChange={handleDatasetChange}
          />
        </Box>
        
        <Box>
          <FormLabel>Neurons</FormLabel>
          <CustomAutocomplete
            options={neurons}
            getOptionLabel={(option) => option.name}
            renderOption={(props, option) => (
              <li {...props}>
                <CheckIcon />
                <Typography>{option.name}</Typography>
              </li>
            )}
            placeholder="Start typing to search"
            className="secondary"
            id="tags-standard"
            popupIcon={<CaretIcon />}
            disabled={formValues.selectedDatasets.length === 0}
            ChipProps={{
              deleteIcon: (
                <IconButton sx={{ p: "0 !important", margin: "0 !important" }}>
                  <CloseIcon />
                </IconButton>
              ),
            }}
            clearIcon={false}
            value={formValues.selectedNeurons}
            onChange={handleNeuronChange}
          />
        </Box>
      </Box>
      <Box borderTop={`0.0625rem solid ${colors.gray100}`} px="1rem" py="0.75rem" gap={0.5} display="flex" justifyContent="flex-end">
        <Button variant="contained" color="info" onClick={handleSubmit} disabled={!formValues.workspaceName}>
          Create workspace
        </Button>
      </Box>
    </CustomDialog>
  );
}

export default CreateNewWorkspaceDialog;
