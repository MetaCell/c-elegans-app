import { BarChart } from "@mui/icons-material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { AppBar, Box, Button, Chip, Container, Grid, IconButton, Toolbar, Typography } from "@mui/material";
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useGlobalContext } from "../contexts/GlobalContext.tsx";
import { CaretIcon, CheckIcon, CloseIcon } from "../icons";
import Logo from "../icons/Logo.svg";
import { GlobalError } from "../models/Error.ts";
import { DatasetsService, NeuronsService } from "../rest";
import { TEMPLATE_ACTIVE_DATASETS } from "../settings/templateWorkspaceSettings.ts";
import { vars } from "../theme/variables.ts";
import AboutModal from "./AboutNemanode/AboutModal.tsx";
import CustomAutocomplete from "./CustomAutocomplete.tsx";

function AppLauncher() {
  const location = useLocation();
  const { workspaces, createWorkspace, setCurrentWorkspace, setSelectedWorkspacesIds, handleErrors } = useGlobalContext();
  const [selectedNeurons, setSelectedNeurons] = useState<string[]>([]);
  const [neuronNames, setNeuronsNames] = useState<string[]>([]);
  const [searchedNeuron, setSearchedNeuron] = useState("");
  const isActive = (path) => location.pathname === path;
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [dataSetsCount, setDataSetsCount] = useState<number | undefined>(undefined);
  const [neuronsCount, setNeuronsCount] = useState<number | undefined>(undefined);

  const handleTemplateClick = async () => {
    const workspaceId = `workspace-${Date.now()}`;
    const workspaceName = `Template Workspace ${Object.keys(workspaces).length + 1}`;
    createWorkspace(workspaceId, workspaceName, new Set(TEMPLATE_ACTIVE_DATASETS), new Set(selectedNeurons));
    setCurrentWorkspace(workspaceId);
    setSelectedWorkspacesIds(new Set<string>([workspaceId]));
  };
  const handleBlankClick = () => {
    const workspaceId = `workspace-${Date.now()}`;
    const workspaceName = `Workspace ${Object.keys(workspaces).length + 1}`;

    createWorkspace(workspaceId, workspaceName, new Set(TEMPLATE_ACTIVE_DATASETS));
    setCurrentWorkspace(workspaceId);
    setSelectedWorkspacesIds(new Set<string>([workspaceId]));
  };
  const fetchNeurons = async () => {
    try {
      const neuronArrays = await NeuronsService.searchCells({
        name: searchedNeuron,
        datasetIds: TEMPLATE_ACTIVE_DATASETS,
      });
      const uniqueNeurons = new Set<string>();
      for (const neuron of neuronArrays.flat()) {
        uniqueNeurons.add(neuron.name);
        uniqueNeurons.add(neuron.nclass);
      }

      setNeuronsNames([...uniqueNeurons]);
    } catch (error) {
      handleErrors(new GlobalError(error.message));
    }
  };

  const fetchCounts = async () => {
    try {
      const cellsCount = await NeuronsService.getCellsCount();
      const dataSetsCount = await DatasetsService.getDatasetsCount();
      setNeuronsCount(cellsCount);
      setDataSetsCount(dataSetsCount);
    } catch (error) {
      setNeuronsCount(0);
      setDataSetsCount(0);
      handleErrors(new GlobalError(error.message));
    }
  };

  const onSearchNeurons = (value) => {
    setSearchedNeuron(value);
    debouncedFetchNeurons(value, TEMPLATE_ACTIVE_DATASETS);
  };

  const handleNeuronChange = (value) => {
    setSelectedNeurons(value);
  };

  const debouncedFetchNeurons = useCallback(debounce(fetchNeurons, 300), []);

  useEffect(() => {
    debouncedFetchNeurons();
    fetchCounts();
  }, []);

  const getSortedNeuronNames = () => {
    const uniqueNeurons = new Set(selectedNeurons.concat(neuronNames));
    return Array.from(uniqueNeurons).sort((a, b) => a.localeCompare(b));
  };

  const openAboutModal = () => {
    setIsAboutModalOpen(true);
  };

  return (
    <>
      <Box>
        <AppBar
          component="nav"
          sx={{
            backgroundColor: vars.gray50,
          }}
        >
          <Toolbar>
            <Box gap=".25rem" display="flex" alignItems="center">
              <Button
                component={Link}
                to="/"
                color="secondary"
                variant="text"
                sx={{
                  backgroundColor: isActive("/") ? vars.gray100 : "transparent",
                }}
              >
                Home
              </Button>
              <Button color="secondary" variant="text" onClick={handleBlankClick}>
                Viewer
              </Button>
              <Button color="secondary" variant="text" onClick={openAboutModal}>
                About Nemanode
              </Button>
            </Box>
            <Chip
              icon={<BarChart />}
              label={`${dataSetsCount === undefined ? "-" : dataSetsCount} datasets, ${neuronsCount === undefined ? "-" : neuronsCount} neurons`}
              variant="outlined"
              className="basic"
            />
          </Toolbar>
        </AppBar>
        <Box className="MuiBox-container">
          <Container className="MuiContainer-center">
            <Grid container spacing={4} justifyContent="center">
              <Grid item xs={12} display="flex" justifyContent="center">
                <img src={Logo} alt="logo" />
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="center" alignItems="center" gap=".75rem">
                <CustomAutocomplete
                  options={getSortedNeuronNames()}
                  renderOption={(props, option) => {
                    // This "trick" is mandatory:
                    // react doesn't like that an object with "key" as entrye is spread into a component that will be part of a list of objects.
                    // Instead it requires that the "key" is set explicitally as parameter of the component
                    return (
                      <li {...props} key={props["key"]}>
                        <CheckIcon />
                        <Typography>{option}</Typography>
                      </li>
                    );
                  }}
                  onInputChange={onSearchNeurons}
                  placeholder="Start typing to select cell(s) to start with"
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
                  value={selectedNeurons}
                  onChange={handleNeuronChange}
                  sx={{
                    flex: 1,
                    maxWidth: "37.5rem",
                    "& .MuiInputBase-root": {
                      backgroundColor: vars.white,
                      padding: "0.75rem 0.875rem",
                    },
                  }}
                />
                <Button
                  color="info"
                  variant="contained"
                  sx={{
                    p: "0.625rem 1rem",
                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                    height: "2.75rem",
                    fontSize: "1rem",
                    fontWeight: "600",
                  }}
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleTemplateClick}
                >
                  Launch viewer
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Box textAlign="center" onClick={handleBlankClick}>
                  <Button variant="outlined">Start with a blank canvas</Button>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
      <AboutModal showModal={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </>
  );
}

export default AppLauncher;
