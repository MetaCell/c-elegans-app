import { AppBar, Button, CircularProgress, CssBaseline, IconButton, Toolbar } from "@mui/material";
import { type Theme, ThemeProvider } from "@mui/material/styles";
import { Suspense } from "react";
import "@metacell/geppetto-meta-ui/flex-layout/style/light.scss";
import { Box } from "@mui/system";
import { useGlobalContext } from "../../contexts/GlobalContext.tsx";
import { DownloadIcon, LinkIcon } from "../../icons";
import theme from "../../theme";
import { vars } from "../../theme/variables.ts";
const { gray100 } = vars;

const drawerWidth = "22.31299rem";
const drawerHeight = "3.5rem";
function CompareWrapper({ children, sidebarOpen }) {
  const { serializeGlobalContext } = useGlobalContext();

  return (
    <>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Suspense fallback={<CircularProgress />}>
          <Box
            sx={{
              padding: sidebarOpen ? "7.5rem 0 0 22.25rem" : "7.5rem 0 0 3.5rem",
              width: "100%",
              display: "flex",
              "& .layout-manager-container": {
                padding: 0,
                width: "50%",
              },
            }}
          >
            <AppBar
              component="nav"
              position="fixed"
              sx={(theme: Theme) => ({
                height: drawerHeight,
                marginTop: drawerHeight,
                transition: theme.transitions.create(["width", "margin"], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.leavingScreen,
                }),
                "& .MuiToolbar-root": {
                  height: drawerHeight,
                  minHeight: drawerHeight,
                  padding: "0 .75rem !important",
                },
                ...(!sidebarOpen && {
                  "& .MuiToolbar-root": {
                    marginLeft: "3.5rem",
                    height: drawerHeight,
                    minHeight: drawerHeight,
                    padding: "0 .75rem !important",
                  },
                }),
                ...(sidebarOpen && {
                  width: `calc(100% - ${drawerWidth})`,
                  transition: theme.transitions.create(["width", "margin"], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                  }),
                }),
              })}
            >
              <Toolbar
                sx={{
                  borderBottom: `0.0625rem solid ${gray100}`,
                }}
              >
                <Box display="flex" alignItems="center" gap={0.5} px={1.5}>
                  <IconButton>
                    <LinkIcon />
                  </IconButton>
                  <IconButton>
                    <DownloadIcon />
                  </IconButton>
                </Box>
                <Box display="flex" gap="0.625rem">
                  <Button
                    color="info"
                    variant="contained"
                    onClick={() => {
                      const url = `${window.location.origin}/share/${serializeGlobalContext()}`;
                      navigator.clipboard
                        .writeText(url)
                        .then(() => alert(`URL copied in clipboard: ${url}`))
                        .catch(() => alert("Failed to copy url to clipboard"));
                    }}
                  >
                    Share
                  </Button>
                </Box>
              </Toolbar>
            </AppBar>
            {children}
          </Box>
        </Suspense>
      </ThemeProvider>
    </>
  );
}

export default CompareWrapper;
