import { useState, useEffect } from "react";
import Stack from '@mui/material/Stack';
import Typography from "@mui/material/Typography";
import Tooltip from '@mui/material/Tooltip';
import FormControlLabel from '@mui/material/FormControlLabel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box } from "@mui/material";
import { vars } from "../../theme/variables.ts";
import CustomSwitch from "./CustomSwitch.tsx";
import PickerWrapper from "./PickerWrapper.tsx";

const { gray600, gray400B, gray500, white, brand600, gray100 } = vars

const CustomListItem = ({ data, showTooltip = true, listType }) => {
  const [checked, setChecked] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#9FEE9A');
  
  const isNeurons = listType === 'neurons';
  const onSwitchChange = (e) => {
    setChecked(e.target.checked);
  };
  
  const handleClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
    setOpen(true);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
    setOpen(false);
  };
  const handleColorChange = (color) => {
    setSelectedColor(color.hex);
  };
  
  return (
    <>
      <FormControlLabel
        control={<CustomSwitch />}
        onChange={onSwitchChange}
        sx={{
          m: 1,
          alignItems: "baseline",
          padding: ".5rem",
          
          "& .MuiFormControlLabel-label": {
            width: "100%",
          },
        }}
        checked={checked}
        label={
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              width={1}
              spacing=".5rem"
            >
              {isNeurons && <Box
                onClick={handleClick}
                sx={{
                  borderRadius: '0.125rem',
                  border: '1px solid rgba(0, 0, 0, 0.20)',
                  background: selectedColor,
                  width: '0.875rem',
                  height: '0.875rem'
                }} />}
              <Typography color={gray600} variant="subtitle1" textWrap="nowrap">
                {data?.label?.length > 32
                  ? data?.label.slice(0, 32) + "..."
                  : data?.label}
              </Typography>
              {showTooltip && (
                <Tooltip title={data.helpText}>
                  <HelpOutlineIcon
                    sx={{
                      color: gray400B,
                      fontSize: "1rem",
                    }}
                  />
                </Tooltip>
              )}
            </Stack>
            {data.description && (
              <Typography color={gray500} variant={"caption"}>
                {data.description}
              </Typography>
            )}
          </Box>
        }
        value={undefined}
      />
      <PickerWrapper
        onChange={handleColorChange}
        selectedColor={selectedColor}
        onClose={handleClose}
        open={open}
        anchorEl={anchorEl}
      />
    </>
  );
};

export default CustomListItem;
