import { CloseOutlined, LayersOutlined } from "@mui/icons-material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Box, FormControl, IconButton, Menu, MenuItem, Snackbar, Stack, TextField, Typography } from "@mui/material";
import Select from "@mui/material/Select";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useGlobalContext } from "../../contexts/GlobalContext.tsx";
import { CheckIcon } from "../../icons";
import type { RootState } from "../../layout-manager/layoutManagerFactory.ts";
import type { Dataset } from "../../rest";
import { vars } from "../../theme/variables.ts";
import CustomListItem from "./CustomListItem.tsx";

const { gray900, gray500, gray400, gray100, gray600 } = vars;

// Categorize datasets based on their visualTime
const categorizeDatasets = (datasets: Dataset[]) => {
  const categories = {
    L1: [],
    L2: [],
    L3: [],
    Adult: [],
  };

  datasets.forEach((dataset) => {
    if (dataset.visualTime >= 0 && dataset.visualTime < 10) {
      categories["L1"].push(dataset);
    } else if (dataset.visualTime >= 10 && dataset.visualTime < 20) {
      categories["L2"].push(dataset);
    } else if (dataset.visualTime >= 20 && dataset.visualTime < 30) {
      categories["L3"].push(dataset);
    } else if (dataset.visualTime >= 30) {
      categories["Adult"].push(dataset);
    }
  });

  return categories;
};

// Map Dataset to ListItem format
const mapDatasetToListItem = (dataset: Dataset, isActive: boolean) => ({
  id: dataset.id, // This is mandatory so that we can get the real Dataset back
  label: dataset.name,
  checked: isActive,
  description: dataset.description,
  helpText: dataset.collection,
});

const DataSets = () => {
  const currentWorkspaceId = useSelector((state: RootState) => state.workspaceId);
  const { datasets, workspaces } = useGlobalContext();
  const currentWorkspace = workspaces[currentWorkspaceId];
  const activeDatasets = currentWorkspace.activeDatasets;

  const categorizedDatasets = categorizeDatasets(Object.values(datasets));

  const [searchInput, setSearchInput] = useState("");
  const [filteredDatasets, setFilteredDatasets] = useState(categorizedDatasets);
  const [filterGroupsValue, setFilterGroupsValue] = useState("All");

  const activeDatasetsList = useMemo(() => Object.values(datasets).filter((dataset) => activeDatasets[dataset.id]), [datasets, activeDatasets]);

  const [filterActiveDatasets, setFilterActiveDatasets] = useState(activeDatasetsList);

  const [selectedType, setSelectedType] = useState<string | null>(null);

  const [showAlert, setShowAlert] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleSwitchChange = async (datasetId: string, checked: boolean) => {
    const dataset = Object.values(datasets).find((ds) => ds.id === datasetId);
    if (!dataset) return;

    if (checked) {
      await currentWorkspace.activateDataset(dataset);
    } else {
      if (activeDatasetsList?.length === 1) {
        setShowAlert(true);
        return;
      }
      await currentWorkspace.deactivateDataset(dataset.id);
    }
  };

  const handleSearchChange = (event) => {
    const inputValue = event.target.value.toLowerCase();
    setSearchInput(inputValue);

    const filteredCategories = {
      L1: [],
      L2: [],
      L3: [],
      Adult: [],
    };

    for (const [category, datasets] of Object.entries(categorizedDatasets)) {
      filteredCategories[category] = datasets.filter((dataset) => dataset.name.toLowerCase().includes(inputValue));
    }

    const filteredActiveList = inputValue ? activeDatasetsList.filter((dataset) => dataset.name.toLowerCase().includes(inputValue)) : activeDatasetsList;

    setFilteredDatasets(filteredCategories);
    setFilterActiveDatasets(filteredActiveList);
  };

  const onSelectGroupChange = (e) => {
    const selectedGroup = e.target.value;
    setFilterGroupsValue(selectedGroup);

    if (selectedGroup === "All") {
      setFilteredDatasets(categorizedDatasets);
      setFilterActiveDatasets(activeDatasetsList);
    } else {
      const activeGroup = categorizedDatasets[selectedGroup];
      // @ts-ignore
      setFilteredDatasets({
        [`${selectedGroup}`]: activeGroup,
      });

      const filteredActive = activeDatasetsList.filter((dataset) => {
        return activeGroup.some((catDataset) => catDataset.id === dataset.id);
      });
      setFilterActiveDatasets(filteredActive);
    }
  };

  const getDatasetsTypes = (datasets: { [key: string]: Dataset }) => {
    const types = new Set<string>();
    Object.values(datasets).forEach((dataset) => {
      if (dataset.type) {
        types.add(dataset.type);
      }
    });
    return Array.from(types);
  };

  const handleTypeSelect = (type: string) => {
    const newSelectedType = selectedType === type ? null : type;
    setSelectedType(newSelectedType);

    const filteredCategories = {
      L1: [],
      L2: [],
      L3: [],
      Adult: [],
    };

    for (const [category, datasets] of Object.entries(categorizedDatasets)) {
      filteredCategories[category] = datasets.filter((dataset) => newSelectedType === null || dataset.type === newSelectedType);
    }

    const filteredActiveList = activeDatasetsList.filter((dataset) => newSelectedType === null || dataset.type === newSelectedType);

    setFilteredDatasets(filteredCategories);
    setFilterActiveDatasets(filteredActiveList);
  };

  useEffect(() => {
    if (filterGroupsValue === "All") {
      setFilterActiveDatasets(activeDatasetsList);
    } else {
      const activeGroup = categorizedDatasets[filterGroupsValue];
      const filteredActive = activeGroup.filter((dataset) => activeDatasets[dataset.id]);
      setFilterActiveDatasets(filteredActive);
    }
  }, [activeDatasetsList, filterGroupsValue]);

  const datasetsTypes = getDatasetsTypes(datasets);

  const action = (
    <React.Fragment>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={() => setShowAlert(false)}
        sx={{
          "&:hover": {
            backgroundColor: "transparent",
          },
        }}
      >
        <CloseOutlined />
      </IconButton>
    </React.Fragment>
  );

  return (
    <Box>
      <Stack spacing=".25rem" p=".75rem" mb="1.5rem" pb="0">
        <Typography variant="body1" component="p" color={gray900} fontWeight={500}>
          Datasets
        </Typography>

        <Typography variant="body1" component="p" color={gray500}>
          Toggle on and off to view datasets on the workspace. This will affect all viewers.
        </Typography>
      </Stack>
      <TextField
        value={searchInput}
        onChange={handleSearchChange}
        placeholder="Search"
        variant="outlined"
        fullWidth
        sx={{
          mb: "1rem",
          "& .MuiOutlinedInput-root": {
            padding: "0.5rem 2rem 0.5rem 0.75rem",
            borderRadius: 0,
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: gray100,
              boxShadow: "none",
            },
            "& .MuiInputBase-input": {
              color: gray600,
              fontWeight: 500,
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderLeft: "none",
              borderRight: "none",
            },
          },
        }}
      />

      <Box p={".75rem"} display="flex" justifyContent="space-between" alignItems="center">
        <FormControl>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={filterGroupsValue}
            IconComponent={KeyboardArrowDownIcon}
            onChange={onSelectGroupChange}
            sx={{
              minWidth: "5rem",
              border: 0,
              color: gray400,
              fontWeight: 500,
              fontSize: ".875rem",

              "& .MuiSelect-select": {
                padding: 0,
                paddingRight: "0 !important",
              },

              "& .MuiSvgIcon-root": {
                margin: "0 !important",
                color: gray400,
                fontWeight: 500,
                fontSize: "1.25rem",
              },
            }}
          >
            <MenuItem value="All">All</MenuItem>
            {Object.keys(categorizedDatasets).map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <IconButton
          sx={{
            padding: ".25rem",
            borderRadius: ".25rem",
          }}
          onClick={handleMenuOpen}
        >
          <LayersOutlined
            sx={{
              color: gray400,
              fontWeight: 500,
              fontSize: "1.25rem",
            }}
          />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          MenuListProps={{
            "aria-labelledby": "layers-button",
          }}
          sx={{
            "& .MuiPaper-root": {
              maxWidth: "10rem",

              "& .MuiMenuItem-root": {
                textTransform: "capitalize",
              },
            },
          }}
        >
          {datasetsTypes.map((type, i) => (
            <MenuItem key={i} value={type} onClick={() => handleTypeSelect(type)}>
              <Box display="flex" alignItems="center" gap=".5rem">
                <Box
                  sx={{
                    visibility: selectedType === type ? "initial" : "hidden",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <CheckIcon />
                </Box>
                {type}
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Box>
      <Box
        sx={{
          height: "calc(100% - 12.75rem)",
          paddingBottom: "0.5rem",
          overflow: "auto",
        }}
      >
        <Box p="0 .25rem" mt={"1rem"} mb="1rem">
          <Stack spacing=".5rem">
            {filterActiveDatasets.length > 0 && (
              <Box p="0 .25rem" mt="1rem">
                <Typography color={gray500} variant="subtitle1" padding=".25rem .5rem" mb=".5rem">
                  Active Datasets
                </Typography>
                <Stack spacing=".5rem">
                  {filterActiveDatasets.map((dataset) => (
                    <CustomListItem key={dataset.id} data={mapDatasetToListItem(dataset, true)} listType="activeDataSets" onSwitchChange={handleSwitchChange} />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Filtered Datasets Group */}
            {Object.entries(filteredDatasets)
              .filter(([_, datasets]) => datasets.length > 0) // Filter out empty categories
              .map(([category, datasets], index) => (
                <Box key={category} p="0 .25rem" mt={index === 0 ? 0 : "1rem"}>
                  <Typography color={gray500} variant="subtitle1" padding=".25rem .5rem" mb=".5rem">
                    {category}
                  </Typography>
                  <Stack spacing=".5rem">
                    {datasets.map((dataset) => (
                      <CustomListItem
                        key={dataset.id}
                        data={mapDatasetToListItem(dataset, Boolean(activeDatasets[dataset.id]))}
                        listType="dataSets"
                        onSwitchChange={handleSwitchChange}
                      />
                    ))}
                  </Stack>
                </Box>
              ))}
          </Stack>
        </Box>
      </Box>
      <Snackbar
        open={showAlert}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        message={"You have to have at least 1 active dataset."}
        action={action}
        autoHideDuration={6000}
      />
    </Box>
  );
};

export default DataSets;
