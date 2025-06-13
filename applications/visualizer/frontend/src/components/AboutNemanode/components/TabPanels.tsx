import { Box } from "@mui/material";
import { TabPanelProps } from "./types";

export const TabPanel = ({
  children,
  value,
  index,
  ...other
}: TabPanelProps) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`tabpanel-${index}`}
    aria-labelledby={`tab-${index}`}
    {...other}
  >
    {value === index && <Box>{children}</Box>}
  </div>
);

export const SecondaryTabPanel = ({
  children,
  value,
  index,
  ...other
}: TabPanelProps) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`secondary-tabpanel-${index}`}
    aria-labelledby={`secondary-tab-${index}`}
    {...other}
  >
    {value === index && <Box>{children}</Box>}
  </div>
);
