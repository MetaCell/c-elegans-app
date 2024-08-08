import { CircularProgress, CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { Suspense } from "react";
import "@metacell/geppetto-meta-ui/flex-layout/style/light.scss";
import { Box } from "@mui/system";
import theme from "../../theme";
function CompareWrapper({ children, sidebarOpen }) {
  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Suspense fallback={<CircularProgress />}>
          <Box
            sx={{
              // backgroundColor: 'red',
              padding: sidebarOpen ? "3.5rem 0 0 22.25rem" : "3.5rem 0 0 3.5rem",
              width: "100%",
              display: "flex",
              "& .layout-manager-container": {
                padding: 0,
                width: "50%",
              },
            }}
          >
            {children}
          </Box>
        </Suspense>
      </ThemeProvider>
    </>
  );
}

export default CompareWrapper;
