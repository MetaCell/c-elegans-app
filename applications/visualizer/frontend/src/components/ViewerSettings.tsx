
import { Box, Divider, Drawer, FormControlLabel, FormGroup, IconButton, Typography } from "@mui/material";
import { CloseIcon, LinkIcon } from "../icons/index.tsx";
import CustomSwitch from "./ViewerContainer/CustomSwitch.tsx";
import { vars } from "../theme/variables.ts";

const { gray900A, gray600, gray100, white, gray50, gray400B, brand600, gray700 } = vars;

const typographyStyles = {
  fontSize: '0.875rem',
  lineHeight: '142.857%',
  fontWeight: 400,
  color: gray900A
}

const secondaryTypographyStyles = {
  ...typographyStyles,
  color: gray600

}

const SyncViewersData = [
  {
    primaryText: 'Connectivity graph',
    secondaryText: 'Instance details',
    selected: false
  },
  {
    primaryText: '3D viewer',
    secondaryText: 'EM viewer',
    selected: false
  },
  {
    primaryText: 'Connectivity graph',
    secondaryText: '3D viewer',
    selected: true
  }
];

const ViewersList = [
  'Connectivity graph',
  '3D viewer',
  'EM viewer',
];

const textStyles = {...secondaryTypographyStyles, fontWeight: 500, flex: 1};
const buttonPadding = { p: '0.25rem' }
const buttonStyle = {...buttonPadding, background: gray50}

const ViewerSettings = ({ open, toggleDrawer }) => {
  return (
    <Drawer 
      anchor="right" 
      open={open} 
      onClose={toggleDrawer(false)}
      sx={{
        '& .MuiDrawer-paper': {
          border: `0.0625rem solid ${gray100}`,
          width: '23.75rem',
          height: 'calc(100% - 4rem)',
          top: '4rem',
          borderRadius: '0.5rem 0 0 0.5rem',
          boxShadow: '-6.25rem 0rem 1.75rem 0rem rgba(0, 0, 0, 0.00), -4rem 0rem 1.625rem 0rem rgba(0, 0, 0, 0.00), -2.25rem 0rem 1.375rem 0rem rgba(0, 0, 0, 0.01), -1rem 0rem 1rem 0rem rgba(0, 0, 0, 0.02), -0.25rem 0rem 0.5625rem 0rem rgba(0, 0, 0, 0.02)'
        },
        '& .MuiBackdrop-root': {
          background: 'transparent'
        }
      }}
    >
      <Box position='sticky' p="0.75rem 0.75rem 0.75rem 1.5rem" top={0} display='flex' alignItems='center' zIndex={1} justifyContent='space-between' borderBottom={`0.0625rem solid ${gray100}`} sx={{background: white}}>
        <Typography
          sx={{
            ...typographyStyles, 
            fontWeight: 500
          }}
        >Viewer settings</Typography>
        <IconButton sx={{
          borderRadius: '0.5rem',
          p: '0.5rem',
          border: `0.0625rem solid ${gray100}`,
          boxShadow: '0rem 0.0625rem 0.125rem 0rem rgba(16, 24, 40, 0.05)',
        }}
          onClick={toggleDrawer(false)}
        >
          <CloseIcon fill={gray700} />
        </IconButton>
      </Box>

      <Box px='1.5rem'>
        <Box py='1.5rem'>
          <Typography
            sx={{...secondaryTypographyStyles, 
              marginBottom: '0.75rem'}}
          >Show/hide viewers</Typography>
          <FormGroup sx={{
            gap: '0.25rem',
            '& .MuiFormControlLabel-root': {
              margin: 0,
              py: '0.5rem'
            },
            '& .MuiTypography-root': {
              color: gray600
            }
          }}>
            {ViewersList?.map((viewer) => {
              return (
                <FormControlLabel control={<CustomSwitch width={28.8} height={16} thumbDimension={12.8} checkedPosition="translateX(0.8125rem)" />} label={<Typography color={gray600} variant="subtitle1">{viewer} graph</Typography>} />
              )
            })}
          </FormGroup>
        </Box>
        <Divider sx={{borderColor: gray100}} />

        <Box py='1.5rem'>
          <Typography
            sx={{...secondaryTypographyStyles, 
              marginBottom: '0.75rem',}}
          >Sync viewers</Typography>

          <Box display='flex' gap='0.25rem' flexDirection='column'>
            {SyncViewersData?.map((data) => {
              return (
                <Box display="flex" alignItems='center' gap="0.75rem" py='0.25rem'>
                  <Typography sx={textStyles}>{data.primaryText}</Typography>
                  <IconButton sx={data.selected ? buttonPadding : buttonStyle}><LinkIcon fill={data.selected ? gray400B : brand600} /></IconButton>
                  <Typography sx={textStyles}>{data.secondaryText}</Typography>
                </Box>
              )
            })}
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}

export default ViewerSettings;
