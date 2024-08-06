import {
  AppBar,
  Box,
  Button,
  ButtonGroup,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography
} from "@mui/material";
import type {Theme} from "@mui/material/styles";
import React, {useState} from "react";
import {
  CiteIcon,
  ConnectionsIcon,
  ContactIcon,
  ContributeIcon,
  DataSourceIcon,
  DownloadIcon,
  MoreOptionsIcon,
  TourIcon
} from "../../icons";
import {vars} from "../../theme/variables.ts";
import CompareWorkspaceDialog from "./CompareWorkspaceDialog.tsx";
import {useGlobalContext} from "../../contexts/GlobalContext.tsx";
import {ViewMode} from "../../models";

const { gray100 } = vars;

const MENU_ARR = [
  {
    id: 0,
    heading: "Learn",
    items: [
      {
        label: "Take a tour",
        icon: TourIcon,
      },
    ],
  },
  {
    id: 1,
    heading: "Data info",
    items: [
      {
        label: "Data sources",
        icon: DataSourceIcon,
      },
      {
        label: "Types of connections",
        icon: ConnectionsIcon,
      },
      {
        label: "Download data",
        icon: DownloadIcon,
      },
      {
        label: "Cite us",
        icon: CiteIcon,
      },
    ],
  },
  {
    id: 2,
    heading: "Development",
    items: [
      {
        label: "Contribute",
        icon: ContributeIcon,
      },
    ],
  },
  {
    id: 3,
    heading: "Help",
    items: [
      {
        label: "Contact us",
        icon: ContactIcon,
      },
    ],
  },
];

const VIEW_OPTIONS = [
  {
    id: 0,
    label: "Default",
    description: "Visualize datasets and neurons, without comparing",
  },
  {
    id: 1,
    label: "Compare",
    description: "Compare between multiple datasets",
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
  const { workspaces, setSelectedWorkspacesIds, setViewMode } = useGlobalContext();
  
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const onClick = (index: number) => {
    setActive(index);

    switch (index) {
      case 1: {
        const keySet = new Set(Object.keys(workspaces));
        setSelectedWorkspacesIds(keySet)
        setViewMode(ViewMode.Compare)
        // setShowModal(true);
      }
        break;
      default:
        setShowModal(false);
    }
  };

  const onClose = () => {
    setShowModal(false);
    setActive(0);
  };
  console.log(workspaces)
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
                <Tooltip placement={index === 0 ? "bottom-start" : "bottom"} title={item.description} key={index}>
                  <Button className={active === index ? "active" : ""} onClick={() => onClick(index)}>
                    {item.label}
                  </Button>
                </Tooltip>
              );
            })}
          </ButtonGroup>

          <Box display="flex" gap="0.625rem">
            <Button color="info" variant="contained">
              Share
            </Button>
            <IconButton
              id="dataset-menu-btn"
              aria-controls={open ? "dataset-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
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
                "aria-labelledby": "dataset-menu-btn",
              }}
            >
              {MENU_ARR.map((menu) => (
                <Box key={menu.id}>
                  <MenuItem disabled>
                    <Typography variant="h4">{menu.heading}</Typography>
                  </MenuItem>
                  {menu.items.map((item) => (
                    <MenuItem key={`menu-${item.label}`}>
                      <item.icon />
                      {item.label}
                    </MenuItem>
                  ))}
                </Box>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      {showModal && <CompareWorkspaceDialog showModal={showModal} onClose={onClose} />}
    </>
  );
};

export default Header;
