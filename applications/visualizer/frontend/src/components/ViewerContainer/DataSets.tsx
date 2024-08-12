import { Box, Stack, Typography, MenuItem, FormControl, IconButton, Select } from "@mui/material";
import { vars } from "../../theme/variables.ts";
import CustomEntitiesDropdown from "./CustomEntitiesDropdown.tsx";
import CustomListItem from "./CustomListItem.tsx";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useGlobalContext } from "../../contexts/GlobalContext.tsx";
import type { Dataset } from "../../rest";

const { gray900, gray500, gray400 } = vars;

// Categorize datasets based on their visualTime
const categorizeDatasets = (datasets: Dataset[]) => {
  const categories = {
    "Development stage 1": [],
    "Development stage 2": [],
    "Development stage 3": [],
    Adult: [],
  };

  datasets.forEach((dataset) => {
    if (dataset.visualTime >= 0 && dataset.visualTime < 10) {
      categories["Development stage 1"].push(dataset);
    } else if (dataset.visualTime >= 10 && dataset.visualTime < 20) {
      categories["Development stage 2"].push(dataset);
    } else if (dataset.visualTime >= 20 && dataset.visualTime < 30) {
      categories["Development stage 3"].push(dataset);
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

  // Categorize the datasets
  const categorizedDatasets = categorizeDatasets(datasets);

  // Handle activation and deactivation of datasets
  const handleSwitchChange = async (datasetId: string, checked: boolean) => {
    const dataset = datasets.find((ds) => ds.id === datasetId);
    if (!dataset) return;

    if (checked) {
      await currentWorkspace.activateDataset(dataset);
    } else {
      await currentWorkspace.deactivateDataset(dataset.id);
    }
  };

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
      <CustomEntitiesDropdown options={[]} onSelect={() => {}} />
      <Box p={".75rem"} display="flex" justifyContent="space-between" alignItems="center">
        <FormControl>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={"all"}
            IconComponent={() => <KeyboardArrowDownIcon />}
            sx={{
              minWidth: "2.5rem",
              border: 0,
              color: gray400,
              fontWeight: 500,
              fontSize: ".875rem",
              "&.Mui-focused": {
                "& .MuiOutlinedInput-notchedOutline": {
                  border: 0,
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
            <MenuItem value={"all"}>All</MenuItem>
          </Select>
        </FormControl>
        <IconButton sx={{ padding: ".25rem", borderRadius: ".25rem" }}>
          <FilterListIcon sx={{ color: gray400, fontWeight: 500, fontSize: "1.25rem" }} />
        </IconButton>
      </Box>
      <Box
        sx={{
          height: "calc(100% - 12.75rem)",
          paddingBottom: "0.5rem",
          overflow: "auto",
        }}
      >
        {Object.entries(categorizedDatasets).map(([category, datasets], index) => (
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
      </Box>
    </Box>
  );
};

export default DataSets;
