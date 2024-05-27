import { useDispatch, useSelector } from "react-redux";
import React, { Suspense, useEffect, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { Box, Button, CircularProgress, CssBaseline, Divider, Drawer, FormControlLabel, FormGroup, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { addWidget } from "@metacell/geppetto-meta-client/common/layout/actions";
import "@metacell/geppetto-meta-ui/flex-layout/style/dark.scss";
import theme from "../theme";
import { useGlobalContext } from "../contexts/GlobalContext.tsx";
import {
  rightComponentWidget,
  threeDViewerWidget,
} from "../layout-manager/widgets.ts";
import Layout from "./ViewerContainer/Layout.tsx";
import { RootState } from "../layout-manager/layoutManagerFactory.ts";
import { AddIcon, CheckIcon, CloseIcon, DownIcon, DownloadIcon, LinkIcon, ViewerSettings } from "../icons/index.tsx";
import CustomSwitch from "./ViewerContainer/CustomSwitch.tsx";
import { vars } from "../theme/variables.ts";

const { gray900A, gray600, gray100, white, gray50, gray400B, brand600, gray700 } = vars;

const typographyStyles = {
  fontSize: '0.875rem',
  lineHeight: '142.857%',
  fontWeight: 400,
  color: gray900A
}

const secondaryTypographyStyles = {
  ...typographyStyles,
  color: gray600

}

const LoadingComponent = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
    }}
  >
    <CircularProgress />
  </Box>
);

function Workspace() {
  const dispatch = useDispatch();
  const { workspaces } = useGlobalContext();

  const workspaceId = useSelector((state: RootState) => state.workspaceId);
  const [LayoutComponent, setLayoutComponent] = useState<React.ComponentType>(() => LoadingComponent);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  const workspace = workspaces[workspaceId];

  useEffect(() => {
    if (workspace.layoutManager) {
      setLayoutComponent(() => workspace.layoutManager.getComponent());
    }
  }, [workspace.layoutManager]);
  
  useEffect(() => {
    dispatch(addWidget(threeDViewerWidget()));
    dispatch(addWidget(rightComponentWidget()));
  }, [LayoutComponent, dispatch]);

  const [anchorElWorkspace, setAnchorElWorkspace] = React.useState<null | HTMLElement>(null);
  const openWorkspace = Boolean(anchorElWorkspace);
  const handleClickWorkspace = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElWorkspace(event.currentTarget);
  };
  const handleCloseWorkspace = () => {
    setAnchorElWorkspace(null);
  };
  
  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Suspense fallback={<CircularProgress />}>
          <Box
            className="layout-manager-container"
            sx={{
              padding: sidebarOpen
                ? "3.5rem 0 0 22.25rem"
                : "3.5rem 0 0 3.5rem",
            }}
          >
            <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <Box p={1} height={1} display='flex'>
              <Box flex={1} borderRadius='0.25rem' border={`0.0625rem solid ${gray100}`} height={1} display='flex' flexDirection='column' sx={{background: white}}>
                <Box p={1.5} display='flex' alignItems='center' justifyContent='space-between' borderBottom={`0.0625rem solid ${gray100}`}>
                  <Box display='flex' alignItems='center' gap={0.5}>
                    <Button 
                      id="dataset-menu-btn"
                      aria-controls={openWorkspace ? 'Workspace-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={openWorkspace ? 'true' : undefined}
                      onClick={handleClickWorkspace}
                      endIcon={<DownIcon />}>Workspace 1</Button>
                    <Menu
                      id="Workspace-menu"
                      anchorEl={anchorElWorkspace}
                      open={openWorkspace}
                      onClose={handleCloseWorkspace}
                      MenuListProps={{
                        'aria-labelledby': 'Workspace-menu-btn',
                      }}
                    >
                      <Box>
                        <MenuItem disabled>
                          <Typography variant="h4">{'Workspaces'}</Typography>
                        </MenuItem>
                        <MenuItem>
                          <AddIcon />
                          New workspace
                        </MenuItem>
                      </Box>
                      <Box>
                        <MenuItem>
                          <CheckIcon />
                          Workspace 1
                        </MenuItem>
                        <MenuItem>
                          <CheckIcon />
                          Workspace 2
                        </MenuItem>
                      </Box>
                    </Menu>
                    <Divider sx={{width: '0.0625rem', height: '1.9375rem', background: gray100}} />
                    <Box display='flex' alignItems='center' gap={0.5} px={1.5}>
                      <IconButton><LinkIcon /></IconButton>
                      <IconButton><DownloadIcon /></IconButton>
                    </Box>
                  </Box>
                  <Button variant="outlined" onClick={toggleDrawer(true)} startIcon={<ViewerSettings />}>Viewer settings</Button>
                  <Drawer 
                    anchor="right" 
                    open={open} 
                    onClose={toggleDrawer(false)}
                    sx={{
                      '& .MuiDrawer-paper': {
                        border: `0.0625rem solid ${gray100}`,
                        width: '23.75rem',
                        height: 'calc(100% - 4rem)',
                        top: '4rem',
                        borderRadius: '0.5rem 0 0 0.5rem',
                        boxShadow: '-6.25rem 0rem 1.75rem 0rem rgba(0, 0, 0, 0.00), -4rem 0rem 1.625rem 0rem rgba(0, 0, 0, 0.00), -2.25rem 0rem 1.375rem 0rem rgba(0, 0, 0, 0.01), -1rem 0rem 1rem 0rem rgba(0, 0, 0, 0.02), -0.25rem 0rem 0.5625rem 0rem rgba(0, 0, 0, 0.02)'
                      },
                      '& .MuiBackdrop-root': {
                        background: 'transparent'
                      }
                    }}
                  >
                    <Box position='sticky' p="0.75rem 0.75rem 0.75rem 1.5rem" top={0} display='flex' alignItems='center' zIndex={1} justifyContent='space-between' borderBottom={`0.0625rem solid ${gray100}`} sx={{background: white}}>
                      <Typography
                        sx={{
                          ...typographyStyles, 
                          fontWeight: 500
                        }}
                      >Viewer settings</Typography>
                      <IconButton sx={{
                        borderRadius: '0.5rem',
                        p: '0.5rem',
                        border: `0.0625rem solid ${gray100}`,
                        boxShadow: '0rem 0.0625rem 0.125rem 0rem rgba(16, 24, 40, 0.05)',
                      }}
                        onClick={toggleDrawer(false)}
                      >
                        <CloseIcon fill={gray700} />
                      </IconButton>
                    </Box>

                    <Box px='1.5rem'>
                      <Box py='1.5rem'>
                        <Typography
                          sx={{...secondaryTypographyStyles, 
                            marginBottom: '0.75rem'}}
                        >Show/hide viewers</Typography>
                        <FormGroup sx={{
                          gap: '0.25rem',
                          '& .MuiFormControlLabel-root': {
                            margin: 0,
                            py: '0.5rem'
                          },
                          '& .MuiTypography-root': {
                            color: gray600
                          }
                        }}>
                          <FormControlLabel control={<CustomSwitch width={28.8} height={16} thumbDimension={12.8} checkedPosition="translateX(0.8125rem)" />} label={<Typography color={gray600} variant="subtitle1">Connectivity graph</Typography>} />
                          <FormControlLabel control={<CustomSwitch width={28.8} height={16} thumbDimension={12.8} checkedPosition="translateX(0.8125rem)" />} label={<Typography color={gray600} variant="subtitle1">3D viewer</Typography>} />
                          <FormControlLabel control={<CustomSwitch width={28.8} height={16} thumbDimension={12.8} checkedPosition="translateX(0.8125rem)" />} label={<Typography color={gray600} variant="subtitle1">EM viewer</Typography>} />
                          <FormControlLabel control={<CustomSwitch width={28.8} height={16} thumbDimension={12.8} checkedPosition="translateX(0.8125rem)" />} label={<Typography color={gray600} variant="subtitle1">Instance details</Typography>} />
                        </FormGroup>
                      </Box>
                      <Divider sx={{borderColor: gray100}} />

                      <Box py='1.5rem'>
                        <Typography
                          sx={{...secondaryTypographyStyles, 
                            marginBottom: '0.75rem',}}
                        >Sync viewers</Typography>

                        <Box display='flex' gap='0.25rem' flexDirection='column'>
                          <Box display="flex" alignItems='center' gap="0.75rem" py='0.25rem'>
                            <Typography sx={{...secondaryTypographyStyles, flex: 1}}>Show/hide viewers</Typography>
                            <IconButton sx={{p: '0.25rem', background: gray50}}><LinkIcon fill={brand600} /></IconButton>
                            <Typography sx={{...secondaryTypographyStyles, flex: 1}}>Instance details</Typography>
                          </Box>
                          <Box display="flex" alignItems='center' gap="0.75rem" py='0.25rem'>
                            <Typography sx={{...secondaryTypographyStyles, flex: 1}}>Show/hide viewers</Typography>
                            <IconButton sx={{p: '0.25rem', background: gray50}}><LinkIcon fill={brand600} /></IconButton>
                            <Typography sx={{...secondaryTypographyStyles, flex: 1}}>Instance details</Typography>
                          </Box>
                          <Box display="flex" alignItems='center' gap="0.75rem" py='0.25rem'>
                            <Typography sx={{...secondaryTypographyStyles, flex: 1}}>Show/hide viewers</Typography>
                            <IconButton sx={{p: '0.25rem'}}><LinkIcon fill={gray400B} /></IconButton>
                            <Typography sx={{...secondaryTypographyStyles, flex: 1}}>Instance details</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Drawer>
                </Box>
                <Box p={1.5} height={1} display='flex'><LayoutComponent /></Box>
              </Box>
            </Box>
          </Box>
        </Suspense>
      </ThemeProvider>
    </>
  );
}

export default Workspace;
