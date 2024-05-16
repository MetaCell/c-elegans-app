import {Box, Stack, Typography, MenuItem, FormControl, IconButton} from "@mui/material";
import { vars } from "../../theme/variables.ts";
import CustomEntitiesDropdown from "./CustomEntitiesDropdown.tsx";
import CustomListItem from "./CustomListItem.tsx";
import Select from '@mui/material/Select';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FilterListIcon from '@mui/icons-material/FilterList';
const { gray900, gray500, gray400 } = vars;

const data = [
  {
    title: "Development stage 1",
    dataSets: [
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: '23 hours after birth', helpText: 'helpText' },
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: '27 hours after birth', helpText: 'helpText' },
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: 'L4 legacy dataset', helpText: 'helpText' },
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: 'L4 legacy dataset', helpText: 'helpText' },
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: 'L4 legacy dataset', helpText: 'helpText' },
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: 'L4 legacy dataset', helpText: 'helpText' },
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: 'L4 legacy dataset', helpText: 'helpText' },
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: 'L4 legacy dataset', helpText: 'helpText' },
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: 'L4 legacy dataset', helpText: 'helpText' },
    ]
  },
  {
    title: "Development stage 2",
    dataSets: [
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: 'L4 legacy dataset', helpText: 'helpText' },
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: 'L4 legacy dataset', helpText: 'helpText' },
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: 'L4 legacy dataset', helpText: 'helpText' },
    ]
  },
  {
    title: "Development stage 3",
    dataSets: [
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: 'L4 legacy dataset', helpText: 'helpText' },
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: 'L4 legacy dataset', helpText: 'helpText' },
    ]
  },
  {
    title: "Adult",
    dataSets: [
      { label: 'Witvliet et al., 2020, Dataset 1 (L1) 0, Dataset 1 (L1)', checked: true, description: '50 hours after birth', helpText: 'helpText' },
    ]
  }
];

const DataSets = () => {
  return (
    <Box>
      <Stack spacing=".25rem" p=".75rem" mb="1.5rem">
        <Typography
          variant="body1"
          component="p"
          color={gray900}
          fontWeight={500}
        >
          Datasets
        </Typography>

        <Typography variant="body1" component="p" color={gray500}>
          Toggle on and off to view datasets on the workspace. This will affect
          all viewers.
        </Typography>
      </Stack>
      <CustomEntitiesDropdown />
      <Box
        p={".75rem"}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
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
          height: "calc(100% - 1rem)",
          overflow: "auto",
        }}
      >
        {data.map((section, index) => (
          <Box p="0 .25rem" mt={index === 0 ? 0 : "1rem"}>
            <Typography
              color={gray500}
              variant="subtitle1"
              padding=".25rem .5rem"
            >
              {section.title}
            </Typography>
            <Stack key={index} spacing=".5rem">
              {section.dataSets.map((item, i) => (
                <CustomListItem key={i} data={item} listType="dataSets" />
              ))}
            </Stack>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default DataSets;
