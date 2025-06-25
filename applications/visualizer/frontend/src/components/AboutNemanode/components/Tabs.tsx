import { Tabs as MuiTabs, Tab } from "@mui/material";
import { styles } from "../styles";
import type { TabsProps } from "./types";

export const PrimaryTabs = ({ value, onChange }: TabsProps) => (
  <MuiTabs value={value} onChange={onChange} aria-label="primary tabs" TabIndicatorProps={{ style: { display: "none" } }} sx={styles.primaryTabs}>
    {["Data info", "Contribute", "Contact us"].map((label, index) => (
      <Tab key={label} label={label} sx={styles.primaryTab(value === index)} />
    ))}
  </MuiTabs>
);

export const SecondaryTabs = ({ value, onChange }: TabsProps) => (
  <MuiTabs
    value={value}
    onChange={onChange}
    aria-label="secondary tabs"
    TabIndicatorProps={{ style: { backgroundColor: "#1568D5", height: "2px" } }}
    sx={styles.secondaryTabs}
  >
    {["Data sources", "Types of connection", "Download data", "Cite us"].map((label, index) => (
      <Tab key={label} label={label} sx={styles.secondaryTab(value === index)} />
    ))}
  </MuiTabs>
);
