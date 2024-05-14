import { Theme } from "@mui/material/styles";
import { AppBar, Box, Button, ButtonGroup, Chip, Dialog, FormControl, FormLabel, IconButton, ListSubheader, Menu, MenuItem, OutlinedInput, Select, SelectChangeEvent, TextField, Toolbar, Tooltip, Typography, Autocomplete} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { vars } from "../../theme/variables.ts";
import React, { useState } from "react";
import { CheckIcon, CloseIcon, MoreOptionsIcon } from "../../icons/index.tsx";
const { gray100 } = vars;

const VIEW_OPTIONS = [
  {
    id: 0,
    label: 'Default',
    description: 'Visualize datasets and neurons, without comparing'
  },
  {
    id: 1,
    label: 'Compare',
    description: 'Compare between multiple datasets'
  }
]

const Header = ({
  sidebarOpen,
  drawerHeight,
  drawerWidth,
}: {
  sidebarOpen: boolean;
  drawerHeight: string;
  drawerWidth: string;
}) => {
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (index: number) => {
    setAnchorEl(null);
    setSelected(index)
  };

  const onClick = (index: number) => {
    setActive(index);

    switch(index) {
      case 1:
        setShowModal(true);
        break;
      default:
        setShowModal(false);
    }
  }

  const onClose = () => {
    setShowModal(false)
    setActive(0)
  }

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
  const allOptions = datasetStages.reduce((acc, curr) => {
    return [...acc, ...curr.options.map(option => ({ ...option, groupName: curr.groupName }))];
  }, []);
  return (
    <>
      <AppBar
        component="nav"
        position="fixed"
        sx={(theme: Theme) => ({
          height: drawerHeight,
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          "& .MuiToolbar-root": {
            height: drawerHeight,
            minHeight: drawerHeight,
            padding: "0 .75rem !important",
          },
          ...(!sidebarOpen && {
            "& .MuiToolbar-root": {
              marginLeft: "3.5rem",
              height: drawerHeight,
              minHeight: drawerHeight,
              padding: "0 .75rem !important",
            },
          }),
          ...(sidebarOpen && {
            width: `calc(100% - ${drawerWidth})`,
            transition: theme.transitions.create(["width", "margin"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        })}
      >
        <Toolbar
          sx={{
            borderBottom: `0.0625rem solid ${gray100}`,
          }}
        >
          <ButtonGroup variant="outlined" aria-label="Basic button group">
            {VIEW_OPTIONS.map((item, index) => {
              return (
                <Tooltip placement={index === 0 ? 'bottom-start' : 'bottom'} title={item.description} key={index}>
                  <Button className={active === index ? 'active' : ''} onClick={() => onClick(index)}>{item.label}</Button>
                </Tooltip>
              )
            })}
          </ButtonGroup>

          <Box display='flex' gap='0.625rem'>
            <Button color="info" variant="contained">Share</Button>
            <IconButton
              id="dataset-menu-btn"
              aria-controls={open ? 'dataset-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleClick}
            >
              <MoreOptionsIcon />
            </IconButton>
            <Menu
              id="dataset-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'dataset-menu-btn',
              }}
            >
              <MenuItem disabled>
                <Typography variant="h4">Datasets</Typography>
              </MenuItem>
              {['Witvliet et al., 2020, Dataset 1 (L1)', 'Witvliet et al., 2020, Dataset 2 (L1)', 'Witvliet et al., 2020, Dataset 3 (L1)', 'Witvliet et al., 2020, Dataset 4 (L1)', 'Witvliet et al., 2020, Dataset 5 (L1)'].map((item, index) => {
                return (
                  <MenuItem key={index} className={selected === index ? 'selected' : ''} onClick={() => handleClose(index)}>
                    <CheckIcon />{item}
                  </MenuItem>
                )
              })}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Dialog 
        onClose={onClose} 
        open={showModal}
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
              options={allOptions}
              groupBy={(option) => option.groupName}
              getOptionLabel={(option) => option.title}
              renderInput={(params) => <TextField {...params} placeholder="Start typing to search" />}
              renderOption={(props, option) => (
                <li {...props}>
                  <div>{option.title}</div>
                  <div>{option.caption}</div>
                </li>
              )}
            />
          </Box>

          <Box>
            <FormLabel>Neurons</FormLabel>
            <Autocomplete
              multiple
              id="tags-standard"
              options={NeuronData}
              getOptionLabel={(option) => option}
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
    </>
  );
};

export default Header;
