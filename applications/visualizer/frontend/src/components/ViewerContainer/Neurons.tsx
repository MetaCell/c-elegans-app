import AddIcon from "@mui/icons-material/Add";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { debounce } from "lodash";
import { useCallback, useState } from "react";
import { useGlobalContext } from "../../contexts/GlobalContext.tsx";
import type { Neuron } from "../../rest";
import { NeuronsService } from "../../rest";
import { vars } from "../../theme/variables.ts";
import CustomEntitiesDropdown from "./CustomEntitiesDropdown.tsx";
import CustomListItem from "./CustomListItem.tsx";

const { gray900, gray500 } = vars;
const mapNeuronsToListItem = (neuron: string, isActive: boolean) => ({
  id: neuron,
  label: neuron,
  checked: isActive,
});
const mapNeuronsAvailableNeuronsToOptions = (neuron: Neuron) => ({
  id: neuron.name,
  label: neuron.name,
  content: [],
});

const Neurons = () => {
  const { workspaces, datasets, currentWorkspaceId } = useGlobalContext();
  const currentWorkspace = workspaces[currentWorkspaceId];
  const activeNeurons = currentWorkspace.activeNeurons;
  const allNeurons = currentWorkspace.allWorkspaceNeurons;
  const availableNeurons = currentWorkspace.availableNeurons;

  const [neurons, setNeurons] = useState(availableNeurons);

  const handleSwitchChange = async (neuronId: string, checked: boolean) => {
    const neuron = availableNeurons[neuronId];

    if (!neuron) return;
    if (checked) {
      await currentWorkspace.activateNeuron(neuron);
    } else {
      await currentWorkspace.deactivateNeuron(neuronId);
    }
  };

  const onNeuronClick = (option) => {
    const neuron = availableNeurons[option.id];
    if (neuron && !activeNeurons.has(option.id)) {
      currentWorkspace.activateNeuron(neuron);
    } else {
      currentWorkspace.deleteNeuron(option.id);
    }
  };
  const handleDeleteNeuron = (neuronId: string) => {
    currentWorkspace.deleteNeuron(neuronId);
  };

  const fetchNeurons = async (name: string, datasetsIds: { id: string }[]) => {
    try {
      const Ids = datasetsIds.map((dataset) => dataset.id);
      const response = await NeuronsService.searchCells({ name: name, datasetIds: Ids });

      // Convert the object to a Record<string, Neuron>
      const neuronsRecord = Object.entries(response).reduce((acc: Record<string, Neuron>, [_, neuron]: [string, Neuron]) => {
        acc[neuron.name] = neuron;
        return acc;
      }, {});

      setNeurons(neuronsRecord);
    } catch (error) {
      console.error("Failed to fetch datasets", error);
    }
  };

  const debouncedFetchNeurons = useCallback(debounce(fetchNeurons, 300), []);

  const onSearchNeurons = (value) => {
    const datasetsIds = Object.keys(datasets);
    debouncedFetchNeurons(value, datasetsIds);
  };

  const autoCompleteOptions = Object.values(neurons).map((neuron: Neuron) => mapNeuronsAvailableNeuronsToOptions(neuron));

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack spacing=".25rem" p=".75rem" mb="1.5rem" pb="0">
        <Typography variant="body1" component="p" color={gray900} fontWeight={500}>
          Neurons
        </Typography>

        <Typography variant="body1" component="p" color={gray500}>
          Search for the neurons and add it to your workspace. This will affect all viewers.
        </Typography>
      </Stack>
      <CustomEntitiesDropdown
        options={autoCompleteOptions}
        activeNeurons={activeNeurons}
        onNeuronClick={onNeuronClick}
        onSearchNeurons={onSearchNeurons}
        setNeurons={setNeurons}
        availableNeurons={availableNeurons}
      />
      <Box
        sx={{
          height: "100%",
          overflow: "auto",
          flex: 1,
        }}
      >
        <Stack spacing=".5rem" p="0 .25rem" mt=".75rem">
          <Box display="flex" alignItems="center" justifyContent="space-between" padding=".25rem .5rem">
            <Typography color={gray500} variant="subtitle1">
              All Neurons
            </Typography>
            <Tooltip title="Create new group">
              <IconButton
                sx={{
                  padding: ".25rem",
                  borderRadius: ".25rem",
                }}
              >
                <AddIcon fontSize="medium" />
              </IconButton>
            </Tooltip>
          </Box>
          {Array.from(allNeurons).map((neuronId) => (
            <CustomListItem
              key={neuronId}
              data={mapNeuronsToListItem(neuronId, activeNeurons.has(neuronId))}
              showTooltip={false}
              showExtraActions={true}
              listType="neurons"
              onSwitchChange={handleSwitchChange}
              onDelete={handleDeleteNeuron}
              deleteTooltipTitle="Remove neuron from the workspace"
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default Neurons;
