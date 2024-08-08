import AddIcon from "@mui/icons-material/Add";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { vars } from "../../theme/variables.ts";
import CustomEntitiesDropdown from "./CustomEntitiesDropdown.tsx";
import CustomListItem from "./CustomListItem.tsx";
const { gray900, gray500 } = vars;

const Neurons = () => {
  const activeNeurons = {
    title: "Active neurons",
    neurons: [
      { label: "ADAR", checked: true, helpText: "helpText" },
      { label: "ADAL", checked: true, helpText: "helpText" },
      { label: "RIDD", checked: true, helpText: "helpText" },
    ],
  };
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
      <CustomEntitiesDropdown />
      <Box
        sx={{
          height: "100%",
          overflow: "auto",
        }}
      >
        <Stack spacing=".5rem" p="0 .25rem" mt=".75rem">
          <Box display="flex" alignItems="center" justifyContent="space-between" padding=".25rem .5rem">
            <Typography color={gray500} variant="subtitle1">
              {activeNeurons.title}
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
          {activeNeurons.neurons.map((item, i) => (
            <CustomListItem key={i} data={item} showTooltip={false} showExtraActions={true} listType="neurons" />
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default Neurons;
