import { Box, Button, FormLabel, IconButton, TextField, Typography } from "@mui/material";
import { debounce } from "lodash";
import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useGlobalContext } from "../contexts/GlobalContext.tsx";
import { CaretIcon, CheckIcon, CloseIcon } from "../icons";
import { GlobalError } from "../models/Error.ts";
import { type Dataset, NeuronsService } from "../rest";
import { vars as colors } from "../theme/variables.ts";
import CustomAutocomplete from "./CustomAutocomplete.tsx";
import CustomDialog from "./CustomDialog.tsx";

const CreateNewWorkspaceDialog = ({ onCloseCreateWorkspace, showCreateWorkspaceDialog, isCompareMode, title, subTitle, submitButtonText }) => {
  const [neuronNames, setNeuronsNames] = useState<string[]>([]);
  const { workspaces, datasets, createWorkspace, setSelectedWorkspacesIds, handleErrors } = useGlobalContext();
  const [searchedNeuron, setSearchedNeuron] = useState("");
  const [formValues, setFormValues] = useState<{
    workspaceName: string;
    selectedDatasets: Dataset[];
    selectedNeurons: string[];
  }>({
    workspaceName: "",
    selectedDatasets: [],
    selectedNeurons: [],
  });
  const [errorMessage, setErrorMessage] = useState<string>("");

  const workspaceFieldName = "workspaceName";

  const fetchNeurons = async (name, datasetsIds) => {
    try {
      const Ids = datasetsIds.map((dataset) => dataset.id);
      const neuronArrays = await NeuronsService.searchCells({
        name: name,
        datasetIds: Ids,
      });

      // We add the neurons classes
      const uniqueNeurons = new Set<string>();
      for (const neuron of neuronArrays.flat()) {
        uniqueNeurons.add(neuron.name);
        uniqueNeurons.add(neuron.nclass);
      }

      setNeuronsNames([...uniqueNeurons]);
    } catch (error) {
      handleErrors(new GlobalError(error.message));
    }
  };

  const debouncedFetchNeurons = useCallback(debounce(fetchNeurons, 300), []);
  const onSearchNeurons = (value) => {
    setSearchedNeuron(value);
    debouncedFetchNeurons(value, formValues.selectedDatasets);
  };
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues({ ...formValues, [name]: value });
    if (name === workspaceFieldName && errorMessage) {
      setErrorMessage("");
    }
  };

  const handleDatasetChange = (value) => {
    setFormValues({ ...formValues, selectedDatasets: value });
    debouncedFetchNeurons(searchedNeuron, value);
  };

  const handleNeuronChange = (value) => {
    setFormValues({ ...formValues, selectedNeurons: value });
  };

  const isWorkspaceNameDuplicate = (name) => {
    return Object.values(workspaces).some((workspace) => workspace.name === name);
  };

  const handleSubmit = () => {
    if (!formValues.workspaceName.trim()) {
      setErrorMessage("Workspace name is required!");
      return;
    }

    if (isWorkspaceNameDuplicate(formValues.workspaceName.trim())) {
      setErrorMessage("Workspace name already exists!");
      return;
    }

    const randomNumber = uuidv4().replace(/\D/g, "").substring(0, 13);
    const newWorkspaceId = `workspace-${randomNumber}`;
    const activeNeurons = new Set(formValues.selectedNeurons);
    const activeDatasets = new Set(formValues.selectedDatasets.map((dataset) => dataset.id));
    createWorkspace(newWorkspaceId, formValues.workspaceName, activeDatasets, activeNeurons);

    if (isCompareMode) {
      const updatedWorkspaces = new Set([...Object.keys(workspaces), newWorkspaceId]);
      setSelectedWorkspacesIds(updatedWorkspaces);
    }
    onCloseCreateWorkspace();
  };
  const datasetsArray = Object.values(datasets);

  return (
    <CustomDialog onClose={onCloseCreateWorkspace} showModal={showCreateWorkspaceDialog} title={title}>
      <Box px="1rem" py="1.5rem" gap={2.5} display="flex" flexDirection="column">
        {subTitle && <Typography>{subTitle}</Typography>}
        <Box>
          <FormLabel>
            Workspace name <Typography variant="caption">(REQUIRED)</Typography>
          </FormLabel>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Start typing workspace name"
            name={workspaceFieldName}
            value={formValues.workspaceName}
            onChange={handleInputChange}
            error={!!errorMessage}
            helperText={errorMessage}
          />
        </Box>

        <Box>
          <FormLabel>Datasets</FormLabel>
          <CustomAutocomplete
            options={datasetsArray}
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
            options={neuronNames}
            renderOption={(props, option) => (
              <li {...props}>
                <CheckIcon />
                <Typography>{option}</Typography>
              </li>
            )}
            onInputChange={onSearchNeurons}
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
          {submitButtonText}
        </Button>
      </Box>
    </CustomDialog>
  );
};

export default CreateNewWorkspaceDialog;
