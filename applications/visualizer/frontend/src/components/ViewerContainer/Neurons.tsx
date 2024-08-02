import AddIcon from "@mui/icons-material/Add";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { useGlobalContext } from "../../contexts/GlobalContext.tsx";
import { vars } from "../../theme/variables.ts";
import CustomEntitiesDropdown from "./CustomEntitiesDropdown.tsx";
import CustomListItem from "./CustomListItem.tsx";
import {Neuron} from "../../rest";
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
  const { workspaces, currentWorkspaceId } = useGlobalContext();
  const currentWorkspace = workspaces[currentWorkspaceId];
  const activeNeurons = currentWorkspace.activeNeurons;
  const availableNeurons = currentWorkspace.availableNeurons;

  const handleSwitchChange = async (neuronId: string, checked: boolean) => {
    const neuron = availableNeurons[neuronId];

    if (!neuron) return;

    if (checked) {
      await currentWorkspace.activateNeuron(neuron);
    } else {
      await currentWorkspace.deactivateNeuron(neuronId);
    }
  };
  const handleDeleteNeuron = (neuronId: string) => {
    console.log(neuronId);
  };
  
  const autoCompleteOptions = Object.values(availableNeurons).map((neuron: Neuron) => mapNeuronsAvailableNeuronsToOptions(neuron))
  console.log(autoCompleteOptions)
  return (
    <Box>
      <Stack spacing=".25rem" p=".75rem" mb="1.5rem" pb="0">
        <Typography variant="body1" component="p" color={gray900} fontWeight={500}>
          Neurons
        </Typography>

        <Typography variant="body1" component="p" color={gray500}>
          Search for the neurons and add it to your workspace. This will affect all viewers.
        </Typography>
      </Stack>
      <CustomEntitiesDropdown options={autoCompleteOptions} />
      <Box
        sx={{
          height: "100%",
          overflow: "auto",
        }}
      >
        <Stack spacing=".5rem" p="0 .25rem" mt=".75rem">
          <Box display="flex" alignItems="center" justifyContent="space-between" padding=".25rem .5rem">
            <Typography color={gray500} variant="subtitle1">
              Active Neurons
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
              data={mapNeuronsToListItem(neuronId, true)}
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
