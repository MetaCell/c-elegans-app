import { Box, Stack, Typography } from "@mui/material";
import { vars } from "../../theme/variables.ts";
const { gray900, gray500 } = vars;

const Neurons = () => {
  return (
    <Box>
      <Stack spacing=".25rem">
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
    </Box>
  );
};

export default Neurons;
