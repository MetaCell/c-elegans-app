import { Box, Stack, Typography } from "@mui/material";
import { vars } from "../../theme/variables.ts";

const { gray900, gray500 } = vars;
const DataSets = () => {
  return (
    <Box>
      <Stack spacing=".25rem">
        <Typography
          variant="body1"
          component="p"
          color={gray900}
          fontWeight={500}
        >
          Datasets
        </Typography>

        <Typography variant="body1" component="p" color={gray500}>
          Toggle on and off to view datasets on the workspace. This will affect
          all viewers.
        </Typography>
      </Stack>
    </Box>
  );
};

export default DataSets;
