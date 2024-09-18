import Autocomplete, { type AutocompleteProps, type AutocompleteRenderInputParams, type AutocompleteRenderGroupParams } from "@mui/material/Autocomplete";
import type { ChipProps } from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import type { SxProps } from "@mui/system";
import type React from "react";

interface CustomAutocompleteProps<T> {
  options: T[];
  getOptionLabel?: (option: T) => string;
  renderOption: (props: React.HTMLAttributes<HTMLLIElement>, option: T) => React.ReactNode;
  renderInput?: (params: AutocompleteRenderInputParams) => React.ReactNode;
  groupBy?: (option: T) => string;
  renderGroup?: (params: AutocompleteRenderGroupParams) => React.ReactNode;
  placeholder?: string;
  className?: string;
  id: string;
  multiple?: boolean;
  popupIcon: React.ReactNode;
  clearIcon?: React.ReactNode;
  ChipProps?: ChipProps;
  sx?: SxProps;
  componentsProps?: AutocompleteProps<T, boolean, boolean, boolean>["componentsProps"];
  value?: T;
  onChange: (v: T ) => void;
  disabled?: boolean;
  onInputChange?: (v: string) => void;
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
  value,
  componentsProps = {},
  onChange,
  disabled = false,
  onInputChange,
}: CustomAutocompleteProps<T>) => {
  // @ts-ignore
  return (
    <Autocomplete
      value={value}
      multiple={multiple}
      className={className}
      id={id}
      disabled={disabled}
      onChange={(event: React.SyntheticEvent, value) => {
        event.preventDefault();
        onChange(value);
      }}
      clearIcon={clearIcon}
      options={options}
      popupIcon={popupIcon}
      getOptionLabel={getOptionLabel}
      ChipProps={ChipProps}
      groupBy={groupBy}
      renderGroup={renderGroup}
      renderOption={renderOption}
      renderInput={(params) => <TextField {...params} placeholder={placeholder} onChange={(e) => onInputChange?.(e.target.value)} />}
      sx={sx}
      componentsProps={componentsProps}
    />
  );
};

export default CommonAutocomplete;
