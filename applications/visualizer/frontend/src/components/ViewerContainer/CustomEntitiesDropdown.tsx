import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchIcon from "@mui/icons-material/Search";
import { Box, InputAdornment, Popper, TextField, Typography } from "@mui/material";
import type React from "react";
import { useEffect, useState } from "react";
import { vars } from "../../theme/variables.ts";

const { gray50, brand600 } = vars;

type OptionDetail = {
  title: string;
  value: string;
};

type Option = {
  id: string;
  label: string;
  content: OptionDetail[];
};

interface CustomEntitiesDropdownProps {
  options: Option[];
  onSelect: (option: Option) => void;
}

const CustomEntitiesDropdown: React.FC<CustomEntitiesDropdownProps> = ({ options, onSelect }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hoveredOption, setHoveredOption] = useState<Option | null>(null);
  const [autocompleteOptions, setAutocompleteOptions] = useState<Option[]>(options);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (anchorEl && !anchorEl.contains(event.target as Node)) {
        setAnchorEl(null);
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [anchorEl]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
    setOpen(!open);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(query));
    setAutocompleteOptions(filteredOptions);
  };

  const handleOptionClick = (event: React.MouseEvent, option: Option) => {
    onSelect(option);
  };

  const handleClickAway = () => {
    setAnchorEl(null);
    setOpen(false);
  };

  const id = open ? "simple-popper" : undefined;

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div>
        <TextField
          onClick={handleClick}
          onChange={handleSearch}
          fullWidth
          type="text"
          placeholder={"Search"}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: "1.25rem" }} />
              </InputAdornment>
            ),
            endAdornment: open && (
              <InputAdornment position="end">
                <Box
                  sx={{
                    borderRadius: "6.25rem",
                    background: gray50,
                    padding: "0.375rem",
                    height: "1.75rem",
                    width: "1.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowForwardIcon sx={{ fontSize: "1.25rem", color: `${brand600} !important`, margin: "0 !important" }} />
                </Box>
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiInputBase-root": {
              borderRight: 0,
              borderLeft: 0,
              borderRadius: 0,
              padding: "1rem 0.75rem",
              height: "3.25rem",
              borderColor: "#ECECE9",
              "&.Mui-focused": {
                background: "#ECECE9",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderWidth: 0,
                },
              },
              "& .MuiInputBase-input": {
                padding: "0",
                height: "1.25rem",
              },

              "& .MuiSvgIcon-root": {
                color: "#969692",
              },
            },
          }}
        />

        <Popper
          id={id}
          open={Boolean(anchorEl)}
          placement="bottom-start"
          anchorEl={anchorEl}
          sx={{
            height: "28.125rem",
            borderRadius: "0.5rem",
            background: "#fff",
            boxShadow: "0 0.5rem 0.5rem -0.25rem rgba(7, 8, 8, 0.03), 0 1.25rem 1.5rem -0.25rem rgba(7, 8, 8, 0.08)",
            m: "0.25rem 0  !important",
            width: autocompleteOptions.length > 0 ? "55.5rem" : "27.75rem",
            display: "flex",
            flexDirection: "column",
            zIndex: 1300,
          }}
        >
          <Box display="flex" flex={1} height={autocompleteOptions.length > 0 ? "calc(100% - 2.75rem)" : "auto"}>
            <Box
              sx={{
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                width: autocompleteOptions.length > 0 ? "50%" : "100%",
              }}
            >
              {autocompleteOptions.length > 0 ? (
                <>
                  <Box overflow="auto" height="calc(100% - (2.75rem + 3.125rem))">
                    <ul>
                      {autocompleteOptions.map((option) => (
                        <li
                          key={option.id}
                          onMouseEnter={() => setHoveredOption(option)}
                          onMouseLeave={() => setHoveredOption(null)}
                          onClick={(event) => handleOptionClick(event, option)}
                        >
                          <Typography sx={{ width: 1, height: 1, padding: "0.625rem" }}>
                            {option?.label?.length > 100 ? option?.label.slice(0, 100) + "..." : option?.label}
                          </Typography>
                        </li>
                      ))}
                    </ul>
                  </Box>
                </>
              ) : (
                <Box>No options found</Box>
              )}
            </Box>
            {autocompleteOptions.length > 0 && (
              <Box
                sx={{
                  width: "50%",
                  overflow: "auto",
                  flexShrink: 0,
                  "& .MuiTypography-body2": {
                    fontSize: "0.875rem",
                    fontWeight: 400,
                    lineHeight: "142.857%",
                    padding: 0,
                  },

                  "& .MuiTypography-body1": {
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    lineHeight: "150%",
                    padding: 0,
                  },
                }}
              >
                {autocompleteOptions.length > 0 &&
                  (hoveredOption ? (
                    <Box>
                      {hoveredOption.content.map((detail, index) => (
                        <Typography key={index} variant="body2">
                          <strong>{detail.title}: </strong>
                          {detail.value}
                        </Typography>
                      ))}
                    </Box>
                  ) : (
                    <Box height={1} display="flex" alignItems="center" justifyContent="center">
                      <Typography variant="body2">Hover over each neuron to see its details</Typography>
                    </Box>
                  ))}
              </Box>
            )}
          </Box>
        </Popper>
      </div>
    </ClickAwayListener>
  );
};

export default CustomEntitiesDropdown;
