import { Box, Stack, Typography } from "@mui/material";
import { vars } from "../../theme/variables.ts";
import CustomEntitiesDropdown from "./CustomEntitiesDropdown.tsx";
const { gray900, gray500 } = vars;

const Neurons = () => {
  return (
    <Box>
      <Stack spacing=".25rem" p=".75rem" mb='1.5rem'>
      <Typography
          variant="body1"
          component="p"
          color={gray900}
          fontWeight={500}
        >
          Neurons
        </Typography>

        <Typography variant="body1" component="p" color={gray500}>
          Search for the neurons and add it to your workspace. This will affect
          all viewers.
        </Typography>
      </Stack>
      <CustomEntitiesDropdown />
      
    </Box>
  );
};

export default Neurons;
