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
import type { EnhancedNeuron } from "../../models/models.ts";

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

const Neurons = ({ children }) => {
  const { workspaces, datasets, currentWorkspaceId } = useGlobalContext();
  const currentWorkspace = workspaces[currentWorkspaceId];
  const activeNeurons = currentWorkspace.activeNeurons;
  const availableNeurons = currentWorkspace.availableNeurons;
  const groups = currentWorkspace.neuronGroups;

  const [neurons, setNeurons] = useState(availableNeurons);

  const handleSwitchChange = async (neuronId: string, isChecked: boolean) => {
    if (isChecked) {
      await currentWorkspace.showNeuron(neuronId);
    } else {
      await currentWorkspace.hideNeuron(neuronId);
    }
  };

  const onNeuronClick = (option) => {
    const neuron = availableNeurons[option.id];
    if (neuron && !activeNeurons.has(option.id)) {
      currentWorkspace.activateNeuron(neuron);
    } else {
      currentWorkspace.deactivateNeuron(option.id);
    }
  };
  const handleDeleteNeuron = (neuronId: string) => {
    currentWorkspace.deactivateNeuron(neuronId);
  };

  const fetchNeurons = async (name: string, datasetsIds: { id: string }[]) => {
    try {
      const ids = datasetsIds.map((dataset) => dataset.id);
      const response = await NeuronsService.searchCells({ name: name, datasetIds: ids });

      // Convert the object to a Record<string, Neuron>
      const neuronsRecord = Object.entries(response).reduce((acc: Record<string, EnhancedNeuron>, [_, neuron]: [string, EnhancedNeuron]) => {
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
      {children}
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
          {Array.from(activeNeurons).map((neuronId) => (
            <CustomListItem
              key={neuronId}
              data={mapNeuronsToListItem(neuronId, currentWorkspace.availableNeurons[neuronId].isVisible)}
              showTooltip={false}
              showExtraActions={true}
              listType="neurons"
              onSwitchChange={handleSwitchChange}
              onDelete={handleDeleteNeuron}
              deleteTooltipTitle="Remove neuron from the workspace"
            />
          ))}
          <Box display="flex" alignItems="center" justifyContent="space-between" padding=".25rem .5rem">
            <Typography color={gray500} variant="subtitle1">
              All Groups
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
          {Array.from(Object.keys(groups)).map((groupId) => (
            <CustomListItem
              key={groupId}
              data={mapNeuronsToListItem(groupId, activeNeurons.has(groupId))}
              showTooltip={false}
              showExtraActions={true}
              listType="groups"
              onSwitchChange={() => console.log("switch")}
              onDelete={() => console.log("delete")}
              deleteTooltipTitle="Remove group from the workspace"
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default Neurons;
