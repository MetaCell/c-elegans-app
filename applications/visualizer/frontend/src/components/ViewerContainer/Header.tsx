import { Theme } from "@mui/material/styles";
import { AppBar, Box, Button, ButtonGroup, Dialog, FormLabel, IconButton, ListSubheader, Menu, MenuItem, TextField, Toolbar, Tooltip, Typography, Autocomplete} from "@mui/material";
import { vars } from "../../theme/variables.ts";
import React, { useState } from "react";
import { CaretIcon, CheckIcon, CiteIcon, CloseIcon, ConnectionsIcon, ContactIcon, ContributeIcon, DataSourceIcon, DownloadIcon, MoreOptionsIcon, TourIcon } from "../../icons/index.tsx";
const { gray100 } = vars;

const MENU_ARR = [
  {
    id: 0,
    heading: 'Learn',
    items: [
      {
        label: 'Take a tour',
        icon: TourIcon
      }
    ]
  },
  {
    id: 1,
    heading: 'Data info',
    items: [
      {
        label: 'Data sources',
        icon: DataSourceIcon
      },
      {
        label: 'Types of connections',
        icon: ConnectionsIcon
      },
      {
        label: 'Download data',
        icon: DownloadIcon
      },
      {
        label: 'Cite us',
        icon: CiteIcon
      }
    ]
  },
  {
    id: 2,
    heading: 'Development',
    items: [
      {
        label: 'Contribute',
        icon: ContributeIcon
      }
    ]
  },
  {
    id: 3,
    heading: 'Help',
    items: [
      {
        label: 'Contact us',
        icon: ContactIcon
      }
    ]
  },
]

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
  const [showModal, setShowModal] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
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
              {MENU_ARR.map((menu) => (
                <Box key={menu.id}>
                  <MenuItem disabled>
                    <Typography variant="h4">{menu.heading}</Typography>
                  </MenuItem>
                  {menu.items.map((item) => (
                    <MenuItem>
                      <item.icon/>
                      {item.label}
                    </MenuItem>
                  ))} 
                </Box>
              ))}
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
    </>
  );
};

export default Header;
