import { Box, Stack, Typography } from "@mui/material";
import { vars } from "../../theme/variables";
import CustomEntitiesDropdown from "./CustomEntitiesDropdown";
import SynapsesTreeView from "./SynapsesTreeView";

const { gray900, gray500 } = vars;

const Synapses = () => {
    return (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "auto",
            }}
        >
            <Stack spacing=".25rem" p=".75rem" mb="1.5rem" pb="0">
                <Typography variant="body1" component="p" color={gray900} fontWeight={500}>
                    Synapses
                </Typography>

                <Typography variant="body1" component="p" color={gray500}>
                    Toggle on and off to view synapses on your selected workspace.
                </Typography>
            </Stack>

            <SynapsesTreeView />
        </Box>
    );
};

export default Synapses;

