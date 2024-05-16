import Switch, { SwitchProps } from '@mui/material/Switch';
import { styled } from '@mui/material/styles';
import {vars} from "../../theme/variables.ts";
import Tooltip from "@mui/material/Tooltip";

const { white, brand600, gray100} = vars

const IOSSwitch = styled((props: SwitchProps) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  marginRight: '.5rem',
  width: 23,
  height: 13,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: '1.5px',
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(9.24px)',
      color: white,
      '& + .MuiSwitch-track': {
        backgroundColor: brand600,
        opacity: 1,
        border: 0,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: gray100,
    },
  },
  
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 10.24,
    height: 10.24,
    boxShadow: 'none'
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: gray100,
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
}));

const CustomSwitch = () => {
  return <Tooltip title={'ss'}><IOSSwitch /></Tooltip>;
};

export default CustomSwitch;