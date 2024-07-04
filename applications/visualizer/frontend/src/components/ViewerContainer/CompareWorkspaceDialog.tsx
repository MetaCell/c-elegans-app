import { Box, Button, Dialog, FormLabel, IconButton, ListSubheader, TextField, Typography, Autocomplete} from "@mui/material";
import { vars } from "../../theme/variables.ts";
import { CaretIcon, CheckIcon, CloseIcon } from "../../icons/index.tsx";
const { gray100 } = vars;


const NeuronData = [
  'ADAC', "ARAC", "VBG"
];

const datasetStages = [
  {
    groupName: 'Development Stage 1',
    options: [
      { title: 'Witvliet et al., 2020, Dataset 1 (L1)', caption: '0 hours from birth' },
      { title: 'Witvliet et al., 2020, Dataset 3 (L1)', caption: '0 hours from birth' },
      { title: 'Witvliet et al., 2020, Dataset 2 (L1)', caption: '0 hours from birth' }
    ]
  },
  {
    groupName: 'Development Stage 2',
    options: [
      { title: 'Witvliet et al., 2020, Dataset 1 (L1)', caption: '0 hours from birth' },
      { title: 'Witvliet et al., 2020, Dataset 3 (L1)', caption: '0 hours from birth' },
      { title: 'Witvliet et al., 2020, Dataset 2 (L1)', caption: '0 hours from birth' }
    ]
  },
];

const CompareWorkspaceDialog = ({
  onClose,
  showModal,
}) => {
  const allOptions = datasetStages.reduce((acc, curr) => {
    return [...acc, ...curr.options.map(option => ({ ...option, groupName: curr.groupName }))];
  }, []);
  return (
    <Dialog 
      onClose={onClose} 
      open={showModal}
      sx={{
        '& .MuiBackdrop-root': {
          background: 'rgba(0,0,0,0.25)'
        }
      }}
      fullWidth
      maxWidth="lg"
    >
      <Box borderBottom={`0.0625rem solid ${gray100}`} px="1rem" py="0.5rem" display='flex' alignItems='center' justifyContent='space-between'>
        <Typography component="h3">New workspace configuration</Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Box>
      <Box px="1rem" py="1.5rem" gap={2.5} display='flex' flexDirection='column'>
        <Typography>To start comparing, create workspace by configuring datasets and neurons you would want in the new workspace or start with an empty workspace.</Typography>
        <Box>
          <FormLabel>Workspace name</FormLabel>
          <TextField fullWidth variant="outlined" placeholder="Start typing workspace name" />
        </Box>

        <Box>
          <FormLabel>Datasets</FormLabel>
          <Autocomplete
            multiple
            id="grouped-demo"
            clearIcon={false}
            options={allOptions}
            ChipProps={{ deleteIcon: <IconButton sx={{ p: '0 !important', margin: '0 !important' }}><CloseIcon /></IconButton> }}
            popupIcon={<CaretIcon />}
            groupBy={(option) => option.groupName}
            getOptionLabel={(option) => option.title}
            renderInput={(params) => <TextField {...params} placeholder="Start typing to search" />}
            renderOption={(props, option) => (
              <li {...props}>
                <CheckIcon />
                <Typography>{option.title}</Typography>
                <Typography component='span'>{option.caption}</Typography>
              </li>
            )}
            renderGroup={(params) => {
              console.log(params, 'params')
              return (
                <li className="grouped-list" key={params.key}>
                  <ListSubheader component="div">
                    {params.group}
                  </ListSubheader>
                  <ul style={{ padding: 0 }}>{params.children}</ul>
                </li>
              )
            }}
          />
        </Box>

        <Box>
          <FormLabel>Neurons</FormLabel>
          <Autocomplete
            multiple
            className="secondary"
            id="tags-standard"
            clearIcon={false}
            options={NeuronData}
            getOptionLabel={(option) => option}
            ChipProps={{ deleteIcon: <IconButton sx={{ p: '0 !important', margin: '0 !important' }}><CloseIcon /></IconButton> }}
            renderOption={(props, option) => (
              <li {...props}>
                <CheckIcon />
                <Typography>{option}</Typography>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Start typing to search"
              />
            )}
          />
        </Box>
      </Box>

      <Box borderTop={`0.0625rem solid ${gray100}`} px="1rem" py="0.75rem" gap={0.5} display='flex' justifyContent='flex-end'>
          <Button variant="text">Start with an empty workspace</Button>
          <Button variant="contained" color="info">Configure workspace</Button>
      </Box>
    </Dialog>
  );
};

export default CompareWorkspaceDialog;
