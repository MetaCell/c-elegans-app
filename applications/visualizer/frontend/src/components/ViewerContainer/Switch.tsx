import {useState} from "react";
import Stack from '@mui/material/Stack';
import Typography from "@mui/material/Typography";
import Switch, { SwitchProps } from '@mui/material/Switch';
import { styled } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import FormControlLabel from '@mui/material/FormControlLabel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {Box} from "@mui/material";
import {vars} from "../../theme/variables.ts";

const {gray600, gray400B, gray500, white, brand600, gray100} = vars

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

const SwitchWidget = ({ data, showTooltip = true }) => {
  const [checked, setChecked] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000');
  
  const onSwitchChange = (e) => {
    setChecked(e.target.checked)
  }
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen(true)
  };
  
  
  const handleClose = () => {
    setAnchorEl(null);
    setOpen(false)
  };
  
  const handleColorChange = (color) => {
    setSelectedColor(color)
  };
  return (
    <>
    <FormControlLabel
      control={<IOSSwitch />}
        onChange={onSwitchChange}
        sx={{
          m: 1,
          alignItems: 'baseline',
          padding: '.5rem',
          
          '& .MuiFormControlLabel-label':{
            width: '100%'
          }
        }}
        checked={checked}
      label={
      <Box>
        <Stack direction="row" alignItems='center' justifyContent="space-between" width={1} spacing='.5rem'>
          {/*<IconButton onClick={handleClick}>*/}
          {/*  <ColorLensOutlinedIcon />*/}
          {/*</IconButton>*/}
          <Typography color={gray600} variant='subtitle1' textWrap='nowrap'>
            {data?.label?.length > 32 ? data?.label.slice(0, 32) + "..." : data?.label}
          </Typography>
          {
            showTooltip && <Tooltip title={data.helpText}>
              <HelpOutlineIcon sx={{
                color: gray400B,
                fontSize: '1rem'
              }} />
            </Tooltip>
          }
          
        </Stack>
        {
          data.description &&  <Typography color={gray500} variant={'caption'}>
            {data.description}
          </Typography>
        }
      </Box>
      
    }
      value={undefined}
    />
      {/*<PickerWrapper onChange={handleColorChange} selectedColor={selectedColor} onClose={handleColorChange} open={open} anchorEl={anchorEl}/>*/}
      </>
  );
};

export default SwitchWidget;