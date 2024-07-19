import FilterListIcon from "@mui/icons-material/FilterList";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Box, FormControl, IconButton, MenuItem, Stack, Typography } from "@mui/material";
import Select from "@mui/material/Select";
import { vars } from "../../theme/variables.ts";
import CustomEntitiesDropdown from "./CustomEntitiesDropdown.tsx";
import CustomListItem from "./CustomListItem.tsx";
const { gray900, gray500, gray400 } = vars;

const data = [
  {
    title: "Development stage 1",
    dataSets: [
      {
        id: "id1",
        label:
          "Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)",
        checked: true,
        description: "23 hours after birth",
        helpText: "helpText",
      },
      {
        id: "id2",
        label: "Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)",
        checked: true,
        description: "27 hours after birth",
        helpText: "helpText",
      },
      {
        id: "id3",
        label: "Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)",
        checked: true,
        description: "L4 legacy dataset",
        helpText: "helpText",
      },
      {
        id: "id4",
        label: "Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)",
        checked: true,
        description: "L4 legacy dataset",
        helpText: "helpText",
      },
      {
        id: "id5",
        label: "Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)",
        checked: true,
        description: "L4 legacy dataset",
        helpText: "helpText",
      },
      {
        id: "id6",
        label: "Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)",
        checked: true,
        description: "L4 legacy dataset",
        helpText: "helpText",
      },
      {
        id: "id7",
        label: "Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)",
        checked: true,
        description: "L4 legacy dataset",
        helpText: "helpText",
      },
      {
        id: "id8",
        label: "Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)",
        checked: true,
        description: "L4 legacy dataset",
        helpText: "helpText",
      },
      {
        id: "id9",
        label: "Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)",
        checked: true,
        description: "L4 legacy dataset",
        helpText: "helpText",
      },
    ],
  },
  {
    title: "Development stage 2",
    dataSets: [
      {
        id: "id10",
        label: "Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)",
        checked: true,
        description: "L4 legacy dataset",
        helpText: "helpText",
      },
      {
        id: "id11",
        label: "Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)",
        checked: true,
        description: "L4 legacy dataset",
        helpText: "helpText",
      },
      {
        id: "id12",
        label: "Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)",
        checked: true,
        description: "L4 legacy dataset",
        helpText: "helpText",
      },
    ],
  },
  {
    title: "Development stage 3",
    dataSets: [
      {
        id: "id13",
        label: "Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)",
        checked: true,
        description: "L4 legacy dataset",
        helpText: "helpText",
      },
      {
        id: "id14",
        label: "Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)",
        checked: true,
        description: "L4 legacy dataset",
        helpText: "helpText",
      },
    ],
  },
  {
    title: "Adult",
    dataSets: [
      {
        id: "id15",
        label: "Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)",
        checked: true,
        description: "50 hours after birth",
        helpText: "helpText",
      },
    ],
  },
];

const DataSets = () => {
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
      <CustomEntitiesDropdown />
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
        {data.map((section, index) => (
          <Box p="0 .25rem" mt={index === 0 ? 0 : "1rem"} key={`section-${section.title}`}>
            <Typography color={gray500} variant="subtitle1" padding=".25rem .5rem" mb=".5rem">
              {section.title}
            </Typography>
            <Stack spacing=".5rem">
              {section.dataSets.map((item) => (
                <CustomListItem key={item.id} data={item} listType="dataSets" />
              ))}
            </Stack>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default DataSets;
