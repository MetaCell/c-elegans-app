import { Box, Button, Dialog, FormLabel, IconButton, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { CaretIcon, CheckIcon, CloseIcon } from "../../icons";
import { type Dataset, type Neuron, NeuronsService } from "../../rest";
import { vars as colors } from "../../theme/variables.ts";
import CustomAutocomplete from "../CustomAutocomplete.tsx";

interface CompareWorkspaceDialogProps {
  onClose: () => void;
  showModal: boolean;
  datasets: Dataset[];
}

const CompareWorkspaceDialog = ({ onClose, showModal, datasets }: CompareWorkspaceDialogProps) => {
  const [neurons, setNeurons] = useState<Neuron[]>([]);

  useEffect(() => {
    const fetchNeurons = async () => {
      try {
        const response = await NeuronsService.getAllCells({ page: 1 });
        setNeurons(response.items);
      } catch (error) {
        console.error("Failed to fetch datasets", error);
      }
    };

    fetchNeurons();
  }, []);

  return (
    <Dialog
      onClose={onClose}
      open={showModal}
      sx={{
        "& .MuiBackdrop-root": {
          background: "rgba(0,0,0,0.25)",
        },
      }}
      fullWidth
      maxWidth="lg"
    >
      <Box borderBottom={`0.0625rem solid ${colors.gray100}`} px="1rem" py="0.5rem" display="flex" alignItems="center" justifyContent="space-between">
        <Typography component="h3">New workspace configuration</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box px="1rem" py="1.5rem" gap={2.5} display="flex" flexDirection="column">
        <Typography>
          To start comparing, create workspace by configuring datasets and neurons you would want in the new workspace or start with an empty workspace.
        </Typography>
        <Box>
          <FormLabel>Workspace name</FormLabel>
          <TextField fullWidth variant="outlined" placeholder="Start typing workspace name" />
        </Box>

        <Box>
          <FormLabel>Datasets</FormLabel>
          <CustomAutocomplete<Dataset>
            options={datasets}
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
          />
        </Box>

        <Box>
          <FormLabel>Neurons</FormLabel>
          <CustomAutocomplete<Neuron>
            options={neurons}
            getOptionLabel={(option) => option.name}
            renderOption={(props, option) => (
              <li {...props}>
                <CheckIcon />
                <Typography>{option.name}</Typography>
              </li>
            )}
            placeholder="Start typing to search"
            className="secondary"
            id="tags-standard"
            popupIcon={<CaretIcon />}
            ChipProps={{
              deleteIcon: (
                <IconButton sx={{ p: "0 !important", margin: "0 !important" }}>
                  <CloseIcon />
                </IconButton>
              ),
            }}
            clearIcon={false}
          />
        </Box>
      </Box>

      <Box borderTop={`0.0625rem solid ${colors.gray100}`} px="1rem" py="0.75rem" gap={0.5} display="flex" justifyContent="flex-end">
        <Button variant="text">Start with an empty workspace</Button>
        <Button variant="contained" color="info">
          Configure workspace
        </Button>
      </Box>
    </Dialog>
  );
};

export default CompareWorkspaceDialog;
