import { Box, IconButton, Stack, Typography, Tooltip } from "@mui/material";
import { vars } from "../../theme/variables.ts";
import CustomEntitiesDropdown from "./CustomEntitiesDropdown.tsx";
import CustomListItem from "./CustomListItem.tsx";
import AddIcon from '@mui/icons-material/Add';
import { useGlobalContext } from "../../contexts/GlobalContext.tsx";

const { gray900, gray500 } = vars;

const Neurons = () => {
  const { workspaces, currentWorkspaceId } = useGlobalContext();
  const currentWorkspace = workspaces[currentWorkspaceId];
  const activeNeurons = currentWorkspace.activeNeurons;
  const availableNeurons = currentWorkspace.availableNeurons;

  // Transform available neurons to options for CustomEntitiesDropdown
  const neuronOptions = Object.values(availableNeurons).map(neuron => ({
    id: neuron.name,
    label: neuron.name,
    content: [
      { title: "Class", value: neuron.nclass },
      { title: "Neurotransmitter", value: neuron.neurotransmitter },
      { title: "Type", value: neuron.type }
    ]
  }));

  // Transform active neurons data to the format expected by CustomListItem
  const neuronList = Array.from(activeNeurons).map(neuronName => {
    const neuron = availableNeurons[neuronName];
    return {
      id: neuron.name,
      label: neuron.name,
      checked: true,
    };
  });

  // Handle activation and deactivation of neurons
  const handleSwitchChange = (neuronName: string, checked: boolean) => {
    const neuron = availableNeurons[neuronName];
    if (!neuron) return;

    if (checked) {
      currentWorkspace.activateNeuron(neuron);
    } else {
      currentWorkspace.deactivateNeuron(neuronName);
    }
  };

  // Handle neuron selection from CustomEntitiesDropdown
  const handleNeuronSelect = (option) => {
    const neuron = availableNeurons[option.id];
    if (neuron) {
      currentWorkspace.activateNeuron(neuron);
    }
  };

  return (
    <Box>
      <Stack spacing=".25rem" p=".75rem" mb='1.5rem' pb='0'>
        <Typography
          variant="body1"
          component="p"
          color={gray900}
          fontWeight={500}
        >
          Neurons
        </Typography>
        <Typography variant="body1" component="p" color={gray500}>
          Search for the neurons and add it to your workspace. This will affect all viewers.
        </Typography>
      </Stack>
      <CustomEntitiesDropdown options={neuronOptions} onSelect={handleNeuronSelect} />
      <Box sx={{ height: "100%", overflow: 'auto' }}>
        <Stack spacing='.5rem' p='0 .25rem' mt='.75rem'>
          <Box display='flex' alignItems='center' justifyContent='space-between' padding='.25rem .5rem'>
            <Typography color={gray500} variant='subtitle1'>
              Active neurons
            </Typography>
            <Tooltip title='Create new group'>
              <IconButton sx={{ padding: '.25rem', borderRadius: '.25rem' }}>
                <AddIcon fontSize='medium' />
              </IconButton>
            </Tooltip>
          </Box>
          {neuronList.map((item) => (
            <CustomListItem
              key={item.id}
              data={item}
              showTooltip={false}
              showExtraActions={true}
              listType='neurons'
              onSwitchChange={handleSwitchChange}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default Neurons;
