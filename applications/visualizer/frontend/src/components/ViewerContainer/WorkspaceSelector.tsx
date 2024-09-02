import { Box, Button, Menu, MenuItem, Typography } from "@mui/material";
import type React from "react";
import { useGlobalContext } from "../../contexts/GlobalContext.tsx";
import { CheckIcon, DownIcon } from "../../icons";
import type { Workspace } from "../../models/workspace.ts";
import { vars } from "../../theme/variables.ts";

const { gray500, gray50, brand600 } = vars;

interface WorkspaceSelectorProps {
  anchorElWorkspace: null | HTMLElement;
  openWorkspace: boolean;
  handleClickWorkspace: (event: React.MouseEvent<HTMLButtonElement>) => void;
  handleCloseWorkspace: () => void;
  onClickWorkspace: (workspace: Workspace) => void;
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  anchorElWorkspace,
  openWorkspace,
  handleClickWorkspace,
  handleCloseWorkspace,
  onClickWorkspace,
}) => {
  const { workspaces, currentWorkspaceId } = useGlobalContext();
  const currentWorkspace = workspaces[currentWorkspaceId];

  return (
    <Box p="1.5rem 0.75rem">
      <Typography variant="body1" component="p" color={gray500} mb=".62rem">
        You’re making changes to
      </Typography>

      <Button
        id="dataset-menu-btn"
        aria-controls={openWorkspace ? "Workspace-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={openWorkspace ? "true" : undefined}
        onClick={handleClickWorkspace}
        endIcon={<DownIcon color={brand600} />}
        sx={{
          width: "100%",
          justifyContent: "space-between",
          padding: "0.625rem 0.875rem !important",
          backgroundColor: gray50,
          color: brand600,
        }}
      >
        {currentWorkspace.name}
      </Button>
      <Menu
        sx={{
          "& .MuiPaper-root": {
            width: "17.25rem",
          },
        }}
        id="Workspace-menu"
        anchorEl={anchorElWorkspace}
        open={openWorkspace}
        onClose={handleCloseWorkspace}
        MenuListProps={{
          "aria-labelledby": "Workspace-menu-btn",
        }}
      >
        <Box>
          {Object.values(workspaces).map((workspace) => (
            <MenuItem
              key={workspace.id}
              value={workspace.id}
              onClick={() => onClickWorkspace(workspace)}
              sx={{
                justifyContent: "space-between",
                backgroundColor: "transparent !important",
              }}
            >
              <Box display="flex" alignItems="center" gap=".5rem">
                <Box
                  sx={{
                    visibility: currentWorkspace.id === workspace.id ? "initial" : "hidden",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <CheckIcon />
                </Box>
                {workspace.name}
              </Box>
            </MenuItem>
          ))}
        </Box>
      </Menu>
    </Box>
  );
};

export default WorkspaceSelector;
