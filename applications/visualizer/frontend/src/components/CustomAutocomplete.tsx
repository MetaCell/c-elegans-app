import Autocomplete, { type AutocompleteProps, type AutocompleteRenderInputParams, type AutocompleteRenderGroupParams } from "@mui/material/Autocomplete";
import type { ChipProps } from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import type { SxProps } from "@mui/system";
import type React from "react";
interface CustomAutocompleteProps<T> {
  options: T[];
  getOptionLabel: (option: T) => string;
  renderOption: (props: React.HTMLAttributes<HTMLLIElement>, option: T) => React.ReactNode;
  renderInput?: (params: AutocompleteRenderInputParams) => React.ReactNode;
  groupBy?: (option: T) => string;
  renderGroup?: (params: AutocompleteRenderGroupParams) => React.ReactNode;
  placeholder?: string;
  className?: string;
  id: string;
  multiple?: boolean;
  popupIcon: React.ReactNode;
  clearIcon?: React.ReactNode; // Change to React.ReactNode to be consistent with popupIcon
  ChipProps?: ChipProps;
  sx?: SxProps;
  componentsProps?: AutocompleteProps<T, boolean, boolean, boolean>["componentsProps"];
}

const CommonAutocomplete = <T,>({
  options,
  getOptionLabel,
  renderOption,
  groupBy,
  renderGroup,
  placeholder = "Start typing to search",
  className = "",
  id,
  multiple = true,
  popupIcon,
  clearIcon,
  ChipProps,
  sx = {},
  componentsProps = {},
}: CustomAutocompleteProps<T>) => {
  return (
    <Autocomplete
      multiple={multiple}
      className={className}
      id={id}
      clearIcon={clearIcon}
      options={options}
      popupIcon={popupIcon}
      getOptionLabel={getOptionLabel}
      ChipProps={ChipProps}
      groupBy={groupBy}
      renderGroup={renderGroup}
      renderOption={renderOption}
      renderInput={(params) => <TextField {...params} placeholder={placeholder} />}
      sx={sx}
      componentsProps={componentsProps}
    />
  );
};

export default CommonAutocomplete;
