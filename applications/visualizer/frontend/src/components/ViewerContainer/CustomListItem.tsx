import { useState } from "react";
import Stack from '@mui/material/Stack';
import Typography from "@mui/material/Typography";
import Tooltip from '@mui/material/Tooltip';
import FormControlLabel from '@mui/material/FormControlLabel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {Box, IconButton} from "@mui/material";
import { vars } from "../../theme/variables.ts";
import CustomSwitch from "./CustomSwitch.tsx";
import PickerWrapper from "./PickerWrapper.tsx";
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import AddIcon from '@mui/icons-material/Add';

const { gray600, gray400B, gray500, gray50, error50, error700 } = vars;

const CustomListItem = ({ data, showTooltip = true, listType, showExtraActions = false }) => {
  const [checked, setChecked] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#9FEE9A');
  const [itemHovered, setItemHovered] = useState(false);
  
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
  
    const handleOnMouseEnter = () => {
    setItemHovered(true);
  };
    
    const handleOnMouseLeave = () => {
    setItemHovered(false);
  };
  
  return (
    <>
      <FormControlLabel
        control={<Tooltip  title={'data.helpText'}><CustomSwitch /></Tooltip>}
        onChange={onSwitchChange}
        onMouseEnter={handleOnMouseEnter}
        onMouseLeave={handleOnMouseLeave}
        sx={{
          m: 1,
          alignItems: "baseline",
          padding: "0.5rem",
          '&:hover': {
            background: gray50,
            borderRadius: '.5rem',
          },
          "& .MuiFormControlLabel-label": {
            width: "100%",
          },
          
          "& .MuiIconButton-root": {
            padding: '.25rem',
            borderRadius: '.25rem',
          }
        }}
        checked={checked}
        label={
          <Stack>
            <Stack
              direction="row"
              alignItems="center"
              width={1}
              spacing=".5rem"
              justifyContent='space-between'
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent='space-between'
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
                <Typography color={gray600} variant="subtitle1">
                  {data?.label?.length > 32
                    ? data?.label.slice(0, 32) + "..."
                    : data?.label}
                </Typography>
              </Stack>
             
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
              {
                showExtraActions && itemHovered && <Box display='flex' alignItems='center' gap='.25rem'>
                <Tooltip title='Remove from all viewers'>
                  <IconButton sx={{
                    padding: '0.125rem !important',
                    
                    '&:hover': {
                      backgroundColor: error50,
                      '& .MuiSvgIcon-root': {
                        color: error700
                      }
                    }
                  }}>
                    <DeleteOutlinedIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
                  <Tooltip title='Add to group'>
                  <IconButton>
                    <AddIcon fontSize='small' />
                  </IconButton>
                  </Tooltip>
                </Box>
              }
            </Stack>
            {data.description && (
              <Typography color={gray500} variant={"caption"}>
                {data.description}
              </Typography>
            )}
          </Stack>
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
