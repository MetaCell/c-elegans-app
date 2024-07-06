import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import React from "react";
// @ts-ignore
interface CustomAutocompleteProps {
  options: any[];
  getOptionLabel: (option: any) => string;
  renderOption: (props: any, option: any) => React.ReactNode;
  renderInput?: (params: never) => React.ReactNode;
  groupBy?: (option: any) => string;
  renderGroup?: (params: any) => React.ReactNode;
  placeholder?: string;
  className?: string;
  id: string;
  multiple?: boolean;
  popupIcon: React.ReactNode;
  clearIcon?: boolean;
  ChipProps?: any;
  sx?: any;
  componentsProps?: any;
}
const CommonAutocomplete = ({
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
    clearIcon = false,
    ChipProps,
    sx = {},
    componentsProps = {},
  }: CustomAutocompleteProps) => {
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
      renderInput={(params) => (
        <TextField {...params} placeholder={placeholder} />
      )}
      sx={sx}
      componentsProps={componentsProps}
    />
  );
};

export default CommonAutocomplete;
