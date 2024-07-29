import { Box, Button, FormLabel, IconButton, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { CaretIcon, CheckIcon, CloseIcon } from "../../icons";
import type { Neuron } from "../../models";
import { NeuronsService } from "../../rest";
import { vars as colors } from "../../theme/variables.ts";
import CustomAutocomplete from "../CustomAutocomplete.tsx";
import CustomDialog from "../CustomDialog.tsx";

interface CompareWorkspaceDialogProps {
  onClose: () => void;
  showModal: boolean;
}

const CompareWorkspaceDialog = ({ onClose, showModal }: CompareWorkspaceDialogProps) => {
  const [neurons, setNeurons] = useState<Neuron[]>([]);

  const fetchNeurons = async () => {
    try {
      const response = await NeuronsService.getAllCells({ page: 1 });
      setNeurons(response.items);
    } catch (error) {
      console.error("Failed to fetch datasets", error);
    }
  };

  useEffect(() => {
    fetchNeurons();
  }, []);

  return (
    <CustomDialog onClose={onClose} showModal={showModal} title={"New workspace configuration"}>
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
          <CustomAutocomplete
            options={[]}
            onChange={(v) => console.log(v)}
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
          <CustomAutocomplete
            options={neurons}
            getOptionLabel={(option) => option.name}
            renderOption={(props, option) => (
              <li {...props}>
                <CheckIcon />
                <Typography>{option.name}</Typography>
              </li>
            )}
            onChange={(v) => console.log(v)}
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
    </CustomDialog>
  );
};

export default CompareWorkspaceDialog;
