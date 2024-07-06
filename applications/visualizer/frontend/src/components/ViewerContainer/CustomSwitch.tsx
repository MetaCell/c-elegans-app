import Switch from '@mui/material/Switch';
import { vars } from "../../theme/variables.ts";
import Tooltip from "@mui/material/Tooltip";
import React from "react";

const { white, brand600, gray100, gray50 } = vars;

interface CustomSwitchProps {
  width?: number;
  height?: number;
  thumbDimension?: number;
  checkedPosition?: string;
  checked?: boolean;
  onChange?: (e) => void;
  disabled?: boolean;
  showTooltip?: boolean;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({
   width,
   height,
   thumbDimension,
   checkedPosition,
   checked,
   onChange,
   disabled = false,
   showTooltip = true,
 }) => {
  const switchComponent = (
    <Switch
      disabled={disabled}
      focusVisibleClassName=".Mui-focusVisible"
      checked={checked}
      onChange={onChange}
      sx={(theme) => ({
        marginRight: '.5rem',
        width: width ?? 23,
        height: height ?? 13,
        padding: 0,
        '& .MuiSwitch-switchBase': {
          padding: 0,
          margin: '0.0938rem',
          transitionDuration: '300ms',
          '&.Mui-checked': {
            transform: checkedPosition ?? 'translateX(0.5775rem)',
            color: white,
            '& + .MuiSwitch-track': {
              backgroundColor: brand600,
              opacity: 1,
              border: 0,
            },
          },
          '&.Mui-disabled .MuiSwitch-thumb': {
            color: gray50,
          },
        },
        '& .MuiSwitch-thumb': {
          boxSizing: 'border-box',
          width: thumbDimension ?? 10.24,
          height: thumbDimension ?? 10.24,
          boxShadow: 'none',
          opacity: 1,
          
        },
        '& .MuiSwitch-track': {
          borderRadius: 26 / 2,
          backgroundColor: gray100,
          opacity: '1 !important',
          transition: theme.transitions.create(['background-color'], {
            duration: 500,
          }),
          
          '&.Mui-disabled': {
            opacity: '1 !important',
          }
        },
      })}
    />
  );
  
  return showTooltip !== false ? (
    <Tooltip title={checked ? "Hide" : "Show"}>
      {switchComponent}
    </Tooltip>
  ) : (
    switchComponent
  );
};

export default CustomSwitch;
