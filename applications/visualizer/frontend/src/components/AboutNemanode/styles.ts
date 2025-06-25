import { vars } from "../../theme/variables";

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
};

export const styles = {
  primaryTabsContainer: {
    borderBottom: 1,
    borderColor: `${vars.gray100}`,
    px: 2,
    py: 1,
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
    alignItems: "center",
  },
  citationBox: {
    fontFamily: "monospace",
    p: 2,
    bgcolor: vars.gray50,
    borderRadius: 1,
  },
  infoBox: {
    bgcolor: vars.gray50,
    borderRadius: 1,
  },
  subtitle: {
    fontWeight: "bold",
  },
  secondaryTabsContainer: {
    position: "sticky",
    top: 0,
    zIndex: 1,
    bgcolor: "background.paper",
    borderBottom: 1,
    borderColor: "divider",
  },
  datasetDownloadItem: {
    borderRadius: "0.5rem",
    border: `1px solid ${vars.gray100}`,
    background: vars.gray50,
    p: 1,
    display: "flex",
    alignItems: "center",
    gap: 1,
    cursor: "pointer",

    "&:hover": {
      background: vars.gray100,
      border: `1px solid ${vars.gray200}`,

      "& .MuiTypography-root": {
        color: `${vars.gray900} !important`,
      },

      "& .datasetDownloadIcon": {
        background: vars.gray200,
        border: `1px solid ${vars.gray200}`,

        "& .MuiSvgIcon-root": {
          color: vars.gray900,
        },
      },
    },
  },
  datasetDownloadIcon: {
    borderRadius: "0.5rem",
    border: `1px solid ${vars.gray100}`,
    background: vars.gray100,
    p: ".25rem",
    width: "1.75rem",
    height: "1.75rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    "& .MuiSvgIcon-root": {
      width: "1.25rem !important",
      height: "1.25rem !important",
    },
  },
  datasetDownloadText: {
    fontWeight: "500 !important",
    color: `${vars.gray500} !important`,
  },
};
