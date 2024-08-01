import FilterListIcon from "@mui/icons-material/FilterList";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Box, FormControl, IconButton, MenuItem, Stack, TextField, Typography } from "@mui/material";
import Select from "@mui/material/Select";
import { useEffect, useMemo, useState } from "react";
import { useGlobalContext } from "../../contexts/GlobalContext.tsx";
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
  const { datasets, workspaces, currentWorkspaceId } = useGlobalContext();
  const currentWorkspace = workspaces[currentWorkspaceId];
  const activeDatasets = currentWorkspace.activeDatasets;

  const categorizedDatasets = categorizeDatasets(Object.values(datasets));

  const [searchInput, setSearchInput] = useState("");
  const [filteredDatasets, setFilteredDatasets] = useState(categorizedDatasets);
  const [filterGroupsValue, setFilterGroupsValue] = useState("All");

  const activeDatasetsList = useMemo(() => Object.values(datasets).filter((dataset) => activeDatasets[dataset.id]), [datasets, activeDatasets]);

  const [filterActiveDatasets, setFilterActiveDatasets] = useState(activeDatasetsList);

  const handleSwitchChange = async (datasetId: string, checked: boolean) => {
    const dataset = Object.values(datasets).find((ds) => ds.id === datasetId);
    if (!dataset) return;

    if (checked) {
      await currentWorkspace.activateDataset(dataset);
    } else {
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
      // @ts-ignore
      setFilteredDatasets({
        [`${selectedGroup}`]: categorizedDatasets[selectedGroup],
      });

      const filteredActive = activeDatasetsList.filter((dataset) => {
        return categorizedDatasets[selectedGroup].some((catDataset) => catDataset.id === dataset.id);
      });

      setFilterActiveDatasets(filteredActive);
    }
  };

  useEffect(() => {
    setFilterActiveDatasets(activeDatasetsList);
  }, [activeDatasetsList]);

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

              "&.Mui-focused": {
                "& .MuiOutlinedInput-notchedOutline": {
                  // border: 0,
                },
              },
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
            {Object.keys(categorizedDatasets).map((key) => (
              <MenuItem key={key} value={key}>
                {key}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <IconButton
          sx={{
            padding: ".25rem",
            borderRadius: ".25rem",
          }}
        >
          <FilterListIcon
            sx={{
              color: gray400,
              fontWeight: 500,
              fontSize: "1.25rem",
            }}
          />
        </IconButton>
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
    </Box>
  );
};

export default DataSets;
