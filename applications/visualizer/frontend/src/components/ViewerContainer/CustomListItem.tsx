import { Add as AddIcon, DeleteOutlined as DeleteOutlinedIcon, HelpOutline as HelpOutlineIcon } from "@mui/icons-material";
import { Box, FormControlLabel, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { vars } from "../../theme/variables.ts";
import CustomSwitch from "./CustomSwitch";
import PickerWrapper from "./PickerWrapper";
const { gray600, gray400B, gray500, gray50, error700 } = vars;

interface CustomListItemProps {
  data: {
    id: string;
    label: string;
    checked: boolean;
    helpText?: string;
    description?: string;
    color?: string;
  };
  showTooltip?: boolean;
  listType: string;
  showExtraActions?: boolean;
  onSwitchChange?: (id: string, checked: boolean) => void;
  onDelete?: (id: string) => void;
  deleteTooltipTitle?: string;
  onColorChange?: (id: string, color: string) => void;
}
const CustomListItem = ({
  data,
  showTooltip = true,
  listType,
  showExtraActions = false,
  onSwitchChange,
  onDelete,
  deleteTooltipTitle,
  onColorChange,
}: CustomListItemProps) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(data.color);
  const [itemHovered, setItemHovered] = useState(false);
  const isNeurons = listType === "neurons";

  const handleSwitchChange = (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    if (onSwitchChange) {
      onSwitchChange(data.id, checked);
    }
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
    onColorChange(data.id, color);
  };

  const handleOnMouseEnter = () => {
    setItemHovered(true);
  };

  const handleOnMouseLeave = () => {
    setItemHovered(false);
  };

  const handleDeleteNeuron = (event) => {
    event.stopPropagation();
    if (onDelete) {
      onDelete(data.id);
    }
  };

  return (
    <>
      <FormControlLabel
        control={
          <Tooltip title={data.helpText}>
            <CustomSwitch checked={data.checked} onChange={handleSwitchChange} />
          </Tooltip>
        }
        onMouseEnter={handleOnMouseEnter}
        onMouseLeave={handleOnMouseLeave}
        sx={{
          m: 1,
          alignItems: "baseline",
          padding: "0.5rem",
          "&:hover": {
            background: gray50,
            borderRadius: ".5rem",
          },
          "& .MuiFormControlLabel-label": {
            width: "100%",
          },
          "& .MuiIconButton-root": {
            padding: ".25rem",
            borderRadius: ".25rem",
          },
        }}
        label={
          <Stack>
            <Stack direction="row" alignItems="center" width={1} spacing=".5rem" justifyContent="space-between">
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing=".5rem">
                {isNeurons && (
                  <Box
                    onClick={handleClick}
                    sx={{
                      borderRadius: "0.125rem",
                      border: "1px solid rgba(0, 0, 0, 0.20)",
                      background: selectedColor,
                      width: "0.875rem",
                      height: "0.875rem",
                    }}
                  />
                )}
                <Typography color={gray600} variant="subtitle1">
                  {data?.label?.length > 32 ? `${data?.label.slice(0, 32)}...` : data?.label}
                </Typography>
              </Stack>
              {showTooltip && (
                <Tooltip title={data.helpText}>
                  <HelpOutlineIcon sx={{ color: gray400B, fontSize: "1rem" }} />
                </Tooltip>
              )}
              {showExtraActions && itemHovered && (
                <Box display="flex" alignItems="center" gap=".25rem">
                  <Tooltip title={deleteTooltipTitle}>
                    <IconButton
                      sx={{
                        padding: "0.125rem !important",
                        "&:hover": { "& .MuiSvgIcon-root": { color: error700 } },
                      }}
                      onClick={handleDeleteNeuron}
                    >
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {isNeurons && (
                    <Tooltip title="Add to group">
                      <IconButton>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              )}
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
      <PickerWrapper onChange={handleColorChange} selectedColor={selectedColor} onClose={handleClose} open={open} anchorEl={anchorEl} />
    </>
  );
};

export default CustomListItem;
