import { Theme } from "@mui/material/styles";
import { AppBar, Toolbar, Typography } from "@mui/material";
import { vars } from "../../theme/variables.ts";
const { gray100 } = vars;

const Header = ({
  sidebarOpen,
  drawerHeight,
  drawerWidth,
}: {
  sidebarOpen: boolean;
  drawerHeight: string;
  drawerWidth: string;
}) => {
  return (
    <AppBar
      component="nav"
      position="fixed"
      sx={(theme: Theme) => ({
        zIndex: theme.zIndex.drawer + 1,
        height: drawerHeight,
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
          borderBottom: `1px solid ${gray100}`,
        }}
      >
        <Typography variant="h6" noWrap component="div">
          Header
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
