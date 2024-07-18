import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Box, FormControlLabel, Stack, Tooltip, Typography } from "@mui/material";
import { vars } from "../../../theme/variables.ts"; // Adjust the import path as needed
import CustomSwitch from "../../ViewerContainer/CustomSwitch.tsx";

const { gray50, gray600, gray400B } = vars;
const CustomFormControlLabel = ({ label, tooltipTitle, helpText }) => {
  return (
    <FormControlLabel
      control={
        <Tooltip title={helpText}>
          <CustomSwitch />
        </Tooltip>
      }
      sx={{
        width: "100%",
        p: ".5rem .5rem .5rem .5rem",
        margin: 0,
        alignItems: "baseline",
        "&:hover": {
          background: gray50,
          borderRadius: ".5rem",
        },
        "& .MuiFormControlLabel-label": {
          width: "100%",
        },
        "& .MuiIconButton-root": {
          borderRadius: ".25rem",
        },
      }}
      label={
        <Box>
          <Stack direction="row" alignItems="center" width={1} spacing=".5rem" justifyContent="space-between">
            <Typography color={gray600} variant="subtitle1">
              {label}
            </Typography>
            <Tooltip title={tooltipTitle}>
              <HelpOutlineIcon
                sx={{
                  color: gray400B,
                  fontSize: "1rem",
                  width: "1rem",
                  height: "1rem",
                }}
              />
            </Tooltip>
          </Stack>
        </Box>
      }
      value={undefined}
    />
  );
};

export default CustomFormControlLabel;
