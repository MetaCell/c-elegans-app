import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchIcon from "@mui/icons-material/Search";
import { Box, InputAdornment, Popper, TextField, Typography } from "@mui/material";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "../../icons";
import type { EnhancedNeuron } from "../../models/models.ts";
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
  activeNeurons: Set<string>;
  onNeuronClick?: (neuron: Option) => void;
  onSearchNeurons?: (value: string) => void;
  setNeurons?: (neurons: Record<string, EnhancedNeuron>) => void;
  availableNeurons: Record<string, EnhancedNeuron>;
}

const CustomEntitiesDropdown = ({ options, activeNeurons, onNeuronClick, onSearchNeurons, setNeurons, availableNeurons }: CustomEntitiesDropdownProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hoveredOption, setHoveredOption] = useState<Option | null>(null);
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const popperRef = useRef<HTMLDivElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
    setOpen(!open);
  };

  const handleOptionClick = (option: Option) => {
    onNeuronClick(option);
  };

  const onSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);
    onSearchNeurons(value);
  };

  const id = open ? "simple-popper" : undefined;

  const filteredOptions = options.filter((option) => !activeNeurons.has(option.id));
  const selectedNeurons = options.filter((option) => activeNeurons.has(option.id));
  const sortedOptions = [...selectedNeurons, ...filteredOptions];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (anchorEl && popperRef.current && !popperRef.current.contains(event.target as Node) && !anchorEl.contains(event.target as Node)) {
        setAnchorEl(null);
        setOpen(false);
        setSearchText("");
        setNeurons(availableNeurons);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [anchorEl]);

  return (
    <>
      <TextField
        value={searchText}
        onClick={handleClick}
        onChange={onSearch}
        fullWidth
        type="text"
        placeholder="Search"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ margin: 0 }}>
              <SearchIcon sx={{ fontSize: "1.25rem", marginLeft: `0 !important` }} />
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
                <ArrowForwardIcon
                  sx={{
                    fontSize: "1.25rem",
                    color: `${brand600} !important`,
                    margin: "0 !important",
                  }}
                />
              </Box>
            </InputAdornment>
          ),
        }}
        sx={{
          "& .MuiInputBase-root": {
            padding: "1rem 0.75rem",

            "& .MuiOutlinedInput-notchedOutline": {
              borderRight: 0,
              borderLeft: 0,
              borderRadius: 0,
            },
          },
        }}
      />

      <Popper
        id={id}
        open={Boolean(anchorEl)}
        placement="bottom-start"
        anchorEl={anchorEl}
        ref={popperRef}
        sx={{
          height: "28.125rem",
          borderRadius: "0.5rem",
          background: "#fff",
          boxShadow: "0 0.5rem 0.5rem -0.25rem rgba(7, 8, 8, 0.03), 0 1.25rem 1.5rem -0.25rem rgba(7, 8, 8, 0.08)",
          m: "0.25rem 0  !important",
          width: options.length > 0 ? "55.5rem" : "27.75rem",
          display: "flex",
          flexDirection: "column",
          zIndex: 1300,
        }}
      >
        <Box display="flex" flex={1} height={options.length > 0 ? "calc(100% - 2.75rem)" : "auto"}>
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              width: options.length > 0 ? "20%" : "100%",
            }}
          >
            {options.length > 0 ? (
              <Box overflow="auto" height="100%">
                <ul>
                  {sortedOptions.map((option) => (
                    <li
                      key={option.id}
                      onMouseEnter={() => setHoveredOption(option)}
                      onMouseLeave={() => setHoveredOption(null)}
                      onClick={() => handleOptionClick(option)}
                      style={{
                        cursor: "pointer",
                        padding: "0.625rem",
                      }}
                    >
                      <Box display="flex" alignItems="center" gap=".5rem">
                        <Box
                          sx={{
                            visibility: selectedNeurons.some((neuron) => option.id === neuron.id) ? "initial" : "hidden",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <CheckIcon />
                        </Box>
                        {option?.label?.length > 100 ? option?.label.slice(0, 100) + "..." : option?.label}
                      </Box>
                    </li>
                  ))}
                </ul>
              </Box>
            ) : (
              <Box>No options available</Box>
            )}
          </Box>
          {options.length > 0 && (
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
              {hoveredOption ? (
                <Box>Content of {hoveredOption.label}</Box>
              ) : (
                <Box height={1} display="flex" alignItems="center" justifyContent="center">
                  <Typography variant="body2">Hover over each item to see details</Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Popper>
    </>
  );
};

export default CustomEntitiesDropdown;
