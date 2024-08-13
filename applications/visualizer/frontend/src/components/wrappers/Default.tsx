import { CircularProgress, CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { Suspense } from "react";
import "@metacell/geppetto-meta-ui/flex-layout/style/light.scss";
import theme from "../../theme";

function DefaultWrapper({ children }) {
  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Suspense fallback={<CircularProgress />}>{children}</Suspense>
      </ThemeProvider>
    </>
  );
}

export default DefaultWrapper;
