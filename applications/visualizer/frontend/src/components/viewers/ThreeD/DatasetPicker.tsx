import type React from "react";
import type { Dataset } from "../../../rest";
import CustomAutocomplete from "../../CustomAutocomplete.tsx";
import { Typography, IconButton } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { CheckIcon, CloseIcon } from "../../../icons";
import { vars } from "../../../theme/variables.ts";

const { gray100, gray600 } = vars;

interface DatasetPickerProps {
  datasets: Dataset[];
  selectedDataset: Dataset;
  onDatasetChange: (dataset: Dataset) => void;
}

const DatasetPicker: React.FC<DatasetPickerProps> = ({ datasets, selectedDataset, onDatasetChange }) => {
  return (
    <CustomAutocomplete
      multiple={false}
      options={datasets}
      value={selectedDataset}
      onChange={(newValue) => onDatasetChange(newValue)}
      getOptionLabel={(option: Dataset) => option.name}
      renderOption={(props, option) => (
        <li {...props}>
          <CheckIcon />
          <Typography>{option.name}</Typography>
        </li>
      )}
      placeholder="Start typing to search"
      className="secondary"
      id="tags-standard"
      popupIcon={<KeyboardArrowDownIcon />}
      ChipProps={{
        deleteIcon: (
          <IconButton sx={{ p: "0 !important", margin: "0 !important" }}>
            <CloseIcon />
          </IconButton>
        ),
      }}
      sx={{
        position: "absolute",
        top: ".5rem",
        right: ".5rem",
        zIndex: 1,
        minWidth: "17.5rem",
        "& .MuiInputBase-root": {
          padding: "0.5rem 2rem 0.5rem 0.75rem !important",
          backgroundColor: gray100,
          boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
          "&.Mui-focused": {
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: gray100,
              boxShadow: "none",
            },
          },
          "& .MuiInputBase-input": {
            color: gray600,
            fontWeight: 500,
          },
        },
      }}
      componentsProps={{
        paper: {
          sx: {
            "& .MuiAutocomplete-listbox": {
              "& .MuiAutocomplete-option": {
                '&[aria-selected="true"]': {
                  backgroundColor: "transparent !important",
                },
              },
            },
          },
        },
      }}
    />
  );
};

export default DatasetPicker;
