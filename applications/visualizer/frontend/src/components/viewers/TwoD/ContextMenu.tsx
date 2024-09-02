import {
  ArrowRightOutlined,
  CallSplitOutlined,
  CloseFullscreen,
  FormatAlignJustifyOutlined,
  GroupOutlined,
  HubOutlined,
  MergeOutlined,
  OpenInFull,
  VisibilityOutlined,
  WorkspacesOutlined,
} from "@mui/icons-material";
import { Box, Divider, Menu, MenuItem, Popover } from "@mui/material";
import type { Core } from "cytoscape";
import type React from "react";
import { useMemo, useState } from "react";
import { alignNeurons, distributeNeurons } from "../../../helpers/twoD/alignHelper.ts";
import { groupNeurons, removeNodeFromGroup } from "../../../helpers/twoD/groupHelper.ts";
import { processNeuronJoin, processNeuronSplit } from "../../../helpers/twoD/splitJoinHelper.ts";
import { useSelectedWorkspace } from "../../../hooks/useSelectedWorkspace.ts";
import { AlignBottomIcon, AlignLeftIcon, AlignRightIcon, AlignTopIcon, DistributeHorizontallyIcon, DistributeVerticallyIcon } from "../../../icons";
import { Alignment, ViewerType, Visibility } from "../../../models";
import { vars } from "../../../theme/variables.ts";

const { gray700 } = vars;

interface ContextMenuProps {
  open: boolean;
  onClose: () => void;
  position: { mouseX: number; mouseY: number } | null;
  setSplitJoinState: React.Dispatch<React.SetStateAction<{ split: Set<string>; join: Set<string> }>>;
  openGroups: Set<string>;
  setOpenGroups: React.Dispatch<React.SetStateAction<Set<string>>>;
  cy: Core;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ open, onClose, position, setSplitJoinState, openGroups, setOpenGroups, cy }) => {
  const workspace = useSelectedWorkspace();
  const [submenuAnchorEl, setSubmenuAnchorEl] = useState<null | HTMLElement>(null);

  const submenuOpen = Boolean(submenuAnchorEl);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSubmenuAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setSubmenuAnchorEl(null);
  };

  const handleAlignOption = (option: Alignment) => {
    alignNeurons(option, Array.from(workspace.selectedNeurons), cy);
    setSubmenuAnchorEl(null);
    onClose();
    setSubmenuAnchorEl(null);
  };

  const handleDistributeOption = (option: Alignment) => {
    distributeNeurons(option, Array.from(workspace.selectedNeurons), cy);
    setSubmenuAnchorEl(null);
    onClose();
  };
  const handleHide = () => {
    workspace.customUpdate((draft) => {
      workspace.selectedNeurons.forEach((neuronId) => {
        const neuron = draft.availableNeurons[neuronId];
        if (neuron && neuron.viewerData[ViewerType.Graph]) {
          neuron.viewerData[ViewerType.Graph].visibility = Visibility.Hidden;
        }
      });
      draft.selectedNeurons.clear();
    });
    onClose();
  };

  const handleGroup = () => {
    const { newGroupId, newGroup, groupsToDelete } = groupNeurons(workspace.selectedNeurons, workspace);

    workspace.customUpdate((draft) => {
      // Add the new group
      draft.neuronGroups[newGroupId] = newGroup;

      // Remove the old groups that were merged into the new group
      groupsToDelete.forEach((groupId) => delete draft.neuronGroups[groupId]);

      // Clear the current selection and select the new group
      draft.selectedNeurons.clear();
      draft.selectedNeurons.add(newGroupId);
    });

    setOpenGroups((prevOpenGroups: Set<string>) => {
      const updatedOpenGroups = new Set(prevOpenGroups);
      let wasGroupOpen = false;

      groupsToDelete.forEach((groupId) => {
        if (updatedOpenGroups.has(groupId)) {
          updatedOpenGroups.delete(groupId);
          wasGroupOpen = true;
        }
      });

      // Only add the new group if any of the deleted groups were open
      if (wasGroupOpen) {
        updatedOpenGroups.add(newGroupId);
      }

      return updatedOpenGroups;
    });

    onClose();
  };
  const handleUngroup = () => {
    const groupsToRemoveFromOpen = new Set<string>();

    workspace.customUpdate((draft) => {
      const nextSelected = new Set<string>();

      for (const elementId of draft.selectedNeurons) {
        if (draft.neuronGroups[elementId]) {
          // Handle the case where the selected element is a group
          const group = draft.neuronGroups[elementId];
          for (const groupedNeuronId of group.neurons) {
            nextSelected.add(groupedNeuronId);
            removeNodeFromGroup(cy, groupedNeuronId, true);
          }
          delete draft.neuronGroups[elementId]; // Delete the entire group
          if (openGroups.has(elementId)) {
            groupsToRemoveFromOpen.add(elementId);
          }
        } else {
          // Handle the case where the selected element is a neuron within a group
          Object.entries(draft.neuronGroups).forEach(([groupId, group]) => {
            if (group.neurons.has(elementId)) {
              group.neurons.delete(elementId); // Remove the neuron from the group
              nextSelected.add(elementId);
              removeNodeFromGroup(cy, elementId, true);

              if (group.neurons.size === 0) {
                // If the group is now empty, delete it
                delete draft.neuronGroups[groupId];
                if (openGroups.has(groupId)) {
                  groupsToRemoveFromOpen.add(groupId);
                }
              }
            }
          });
        }
      }

      draft.selectedNeurons = nextSelected;
    });

    // Remove groups from the openGroups set
    setOpenGroups((prevOpenGroups: Set<string>) => {
      const updatedOpenGroups = new Set<string>(prevOpenGroups);
      groupsToRemoveFromOpen.forEach((groupId) => updatedOpenGroups.delete(groupId));
      return updatedOpenGroups;
    });

    onClose();
  };

  const handleSplit = () => {
    setSplitJoinState((prevState) => {
      return processNeuronSplit(workspace, prevState);
    });
    onClose();
  };

  const handleJoin = () => {
    setSplitJoinState((prevState) => {
      return processNeuronJoin(workspace, prevState);
    });
    onClose();
  };

  const handleAddToWorkspace = () => {
    workspace.customUpdate((draft) => {
      workspace.selectedNeurons.forEach((neuronId) => {
        const group = workspace.neuronGroups[neuronId];
        if (group) {
          group.neurons.forEach((groupedNeuronId) => {
            draft.activeNeurons.add(groupedNeuronId);
            if (draft.availableNeurons[groupedNeuronId]) {
              draft.availableNeurons[groupedNeuronId].isVisible = true;
            }
          });
        } else {
          draft.activeNeurons.add(neuronId);
          if (draft.availableNeurons[neuronId]) {
            draft.availableNeurons[neuronId].isVisible = true;
          }
        }
      });
    });
    onClose();
  };

  const handleOpenGroup = () => {
    workspace.selectedNeurons.forEach((neuronId) => {
      if (workspace.neuronGroups[neuronId] && !openGroups.has(neuronId)) {
        // Mark the group as open
        setOpenGroups((prevOpenGroups: Set<string>) => {
          const updatedOpenGroups = new Set<string>(prevOpenGroups);
          updatedOpenGroups.add(neuronId);
          return updatedOpenGroups;
        });
      }
    });
    onClose();
  };
  const handleCloseGroup = () => {
    workspace.selectedNeurons.forEach((neuronId) => {
      if (workspace.neuronGroups[neuronId] && openGroups.has(neuronId)) {
        // Mark the group as closed
        setOpenGroups((prevOpenGroups: Set<string>) => {
          const updatedOpenGroups = new Set<string>(prevOpenGroups);
          updatedOpenGroups.delete(neuronId);
          return updatedOpenGroups;
        });
      }
    });
    onClose();
  };

  const groupEnabled = useMemo(() => {
    const groupOrPartOfGroupSet = new Set<string>();
    let nonGroupOrPartCount = 0;

    Array.from(workspace.selectedNeurons).forEach((neuronId) => {
      const isGroup = Boolean(workspace.neuronGroups[neuronId]);
      const isPartOfGroup = Object.entries(workspace.neuronGroups).find(([, group]) => group.neurons.has(neuronId));

      if (isGroup) {
        groupOrPartOfGroupSet.add(neuronId);
      } else if (isPartOfGroup) {
        groupOrPartOfGroupSet.add(isPartOfGroup[0]);
      } else {
        nonGroupOrPartCount++;
      }
    });

    // Enable grouping if there are neurons not in any group and at most one group or part of a group is selected.
    return nonGroupOrPartCount > 0 && groupOrPartOfGroupSet.size <= 1;
  }, [workspace.selectedNeurons, workspace.neuronGroups]);

  const ungroupEnabled = useMemo(() => {
    return Array.from(workspace.selectedNeurons).some((neuronId) => {
      // Check if the neuronId is a group itself
      const isGroup = Boolean(workspace.neuronGroups[neuronId]);

      // Check if the neuronId is part of any group
      const isPartOfGroup = Object.values(workspace.neuronGroups).some((group) => group.neurons.has(neuronId));

      // Enable ungroup if the neuron is a group or is part of a group
      return isGroup || isPartOfGroup;
    });
  }, [workspace.selectedNeurons, workspace.neuronGroups]);

  const splitEnabled = useMemo(() => {
    return Array.from(workspace.selectedNeurons).some((neuronId) => {
      const neuron = workspace.availableNeurons[neuronId];
      return neuron && neuron.name === neuron.nclass;
    });
  }, [workspace.selectedNeurons, workspace.availableNeurons]);

  const joinEnabled = useMemo(() => {
    return Array.from(workspace.selectedNeurons).some((neuronId) => {
      const neuron = workspace.availableNeurons[neuronId];
      return neuron && neuron.name !== neuron.nclass;
    });
  }, [workspace.selectedNeurons, workspace.availableNeurons]);

  const openGroupEnabled = useMemo(() => {
    return Array.from(workspace.selectedNeurons).some((neuronId) => workspace.neuronGroups[neuronId] && !openGroups.has(neuronId));
  }, [workspace.selectedNeurons, workspace.neuronGroups, openGroups]);

  const closeGroupEnabled = useMemo(() => {
    return Array.from(workspace.selectedNeurons).some((neuronId) => workspace.neuronGroups[neuronId] && openGroups.has(neuronId));
  }, [workspace.selectedNeurons, workspace.neuronGroups, openGroups]);
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault(); // Prevent default context menu
  };

  return (
    <Menu
      anchorReference="anchorPosition"
      anchorPosition={position !== null ? { top: position.mouseY, left: position.mouseX } : undefined}
      open={open}
      onClose={onClose}
      onContextMenu={handleContextMenu}
      sx={{
        "& .MuiMenuItem-root": {
          color: gray700,
        },
      }}
    >
      <MenuItem onClick={handleHide}>
        <VisibilityOutlined fontSize="small" />
        Hide
      </MenuItem>
      <MenuItem onClick={handleAddToWorkspace}>
        <HubOutlined fontSize="small" />
        Add to Workspace
      </MenuItem>
      {joinEnabled && (
        <MenuItem onClick={handleJoin} disabled={!joinEnabled}>
          <MergeOutlined fontSize="small" />
          Join Left-Right
        </MenuItem>
      )}
      {splitEnabled && (
        <MenuItem onClick={handleSplit} disabled={!splitEnabled}>
          <CallSplitOutlined fontSize="small" />
          Split Left-Right
        </MenuItem>
      )}

      <Divider />
      {groupEnabled && (
        <MenuItem onClick={handleGroup} disabled={!groupEnabled}>
          <GroupOutlined fontSize="small" />
          Group
        </MenuItem>
      )}
      {ungroupEnabled && (
        <MenuItem onClick={handleUngroup} disabled={!ungroupEnabled}>
          <WorkspacesOutlined fontSize="small" />
          Ungroup
        </MenuItem>
      )}
      {openGroupEnabled && (
        <MenuItem onClick={handleOpenGroup} disabled={!openGroupEnabled}>
          <OpenInFull fontSize="small" />
          Open Group
        </MenuItem>
      )}
      {closeGroupEnabled && (
        <MenuItem onClick={handleCloseGroup} disabled={!closeGroupEnabled}>
          <CloseFullscreen fontSize="small" style={{ transform: "rotate(180deg)" }} />
          Close Group
        </MenuItem>
      )}
      <MenuItem onMouseEnter={handlePopoverOpen}>
        <FormatAlignJustifyOutlined fontSize="small" />
        <Box width={1} display="flex" alignItems="center" justifyContent="space-between">
          Align
          <ArrowRightOutlined />
        </Box>
      </MenuItem>
      <Popover
        id="mouse-over-popover"
        sx={{
          "& .MuiMenuItem-root": {
            color: gray700,
          },
          "& .MuiPopover-paper": {
            padding: "0.5rem",
            borderRadius: "0.5rem",
          },
        }}
        open={submenuOpen}
        anchorEl={submenuAnchorEl}
        anchorOrigin={{
          vertical: "center",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <MenuItem onClick={() => handleAlignOption(Alignment.Left)}>
          <AlignLeftIcon />
          Align left
        </MenuItem>
        <MenuItem onClick={() => handleAlignOption(Alignment.Right)}>
          <AlignRightIcon />
          Align right
        </MenuItem>
        <MenuItem onClick={() => handleAlignOption(Alignment.Top)}>
          <AlignTopIcon />
          Align top
        </MenuItem>
        <MenuItem onClick={() => handleAlignOption(Alignment.Bottom)}>
          <AlignBottomIcon />
          Align bottom
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleDistributeOption(Alignment.Horizontal)}>
          <DistributeHorizontallyIcon />
          Distribute horizontally
        </MenuItem>
        <MenuItem onClick={() => handleDistributeOption(Alignment.Vertical)}>
          <DistributeVerticallyIcon />
          Distribute vertically
        </MenuItem>
      </Popover>
    </Menu>
  );
};

export default ContextMenu;
