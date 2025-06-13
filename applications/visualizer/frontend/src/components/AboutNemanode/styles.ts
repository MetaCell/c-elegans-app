import { vars } from "../../theme/variables"

export const tab_styles = {
  primary: {
    textTransform: "none",
    fontWeight: 600,
    borderRadius: ".5rem !important",
  },
  secondary: {
    textTransform: "none",
    fontWeight: 600,
  },
}

export const styles = {
  primaryTabsContainer: {
    borderBottom: 1,
    borderColor: `${vars.gray100}`,
    px: 2,
    py: 1
  },
  primaryTabs: {
    "& .MuiTabs-flexContainer": {
      justifyContent: "flex-start",
    },
  },
  primaryTab: (isSelected: boolean) => ({
    ...tab_styles.primary,
    bgcolor: isSelected ? vars.gray100 : "transparent",
    color: isSelected ? `${vars.gray700} !important` : vars.gray600,
  }),
  secondaryTabs: {
    px: 1,
    "& .MuiTabs-flexContainer": {
      justifyContent: "flex-start",
    },
  },
  secondaryTab: (isSelected: boolean) => ({
    ...tab_styles.secondary,
    color: isSelected ? vars.brand600 : "text.secondary",
    "&.Mui-selected": {
      color: vars.brand600,
    },
  }),
  dialogContent: {
    px: 0,
    py: 0,
  },
  datasetEntry: {
    display: "flex",
    alignItems: "flex-start"
  },
  citationBox: {
    fontFamily: "monospace",
    p: 2,
    bgcolor: vars.gray50,
    borderRadius: 1
  },
  infoBox: {
    bgcolor: vars.gray50,
    borderRadius: 1
  },
  subtitle: {
    fontWeight: "bold"
  },
  secondaryTabsContainer: {
    position: "sticky",
    top: 0,
    zIndex: 1,
    bgcolor: "background.paper",
    borderBottom: 1,
    borderColor: "divider"
  }
} 