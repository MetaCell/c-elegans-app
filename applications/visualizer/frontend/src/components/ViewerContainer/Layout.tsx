import CssBaseline from "@mui/material/CssBaseline";
import Header from "./Header.tsx";
import Sidebar from "./Sidebar.tsx";

const drawerWidth = "22.31299rem";
const drawerHeight = "3.5rem";
const Layout = ({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}) => {
  return (
    <>
      <CssBaseline />
      <Header sidebarOpen={sidebarOpen} drawerHeight={drawerHeight} drawerWidth={drawerWidth} />
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} drawerHeight={drawerHeight} drawerWidth={drawerWidth} />
    </>
  );
};

export default Layout;
