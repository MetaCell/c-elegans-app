import React, { useMemo } from "react";
import { Menu, MenuItem } from "@mui/material";
import {NeuronGroup, Workspace} from "../../../models";

interface ContextMenuProps {
  open: boolean;
  onClose: () => void;
  workspace: Workspace;
  position: { mouseX: number; mouseY: number } | null;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ open, onClose, workspace, position }) => {
  const handleClearSelections = () => {
    workspace.clearSelectedNeurons();
    onClose();
  };

  const handleGroup = () => {
    const newGroupId = `group_${Date.now()}`;
    const newGroupNeurons = new Set<string>();

    for (const neuronId of workspace.selectedNeurons) {
      const group = workspace.neuronGroups[neuronId];
      if (group) {
        for (const groupedNeuronId of group.neurons) {
          newGroupNeurons.add(groupedNeuronId);
        }
      } else {
        newGroupNeurons.add(neuronId);
      }
    }

    const newGroup: NeuronGroup = {
      id: newGroupId,
      name: newGroupId,
      color: "#9FEE9A",
      neurons: newGroupNeurons,
    };

    workspace.batchUpdate(draft => {
      draft.neuronGroups[newGroupId] = newGroup;
      draft.selectedNeurons.clear();
      draft.selectedNeurons.add(newGroupId);
    });
    onClose();
  };

   const handleUngroup = () => {
    workspace.batchUpdate(draft => {
      for (const elementId of draft.selectedNeurons) {
        if (draft.neuronGroups[elementId]) {
          const group = draft.neuronGroups[elementId];
          for (const groupedNeuronId of group.neurons) {
            draft.selectedNeurons.add(groupedNeuronId);
          }
          delete draft.neuronGroups[elementId];
        }
      }
    });
    onClose();
  };

  const groupEnabled = useMemo(() => {
    return Array.from(workspace.selectedNeurons).some((neuronId) => !workspace.neuronGroups[neuronId]);
  }, [workspace.selectedNeurons, workspace.neuronGroups]);

  const ungroupEnabled = useMemo(() => {
    return Array.from(workspace.selectedNeurons).some((neuronId) => workspace.neuronGroups[neuronId]);
  }, [workspace.selectedNeurons, workspace.neuronGroups]);

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
    >
      <MenuItem onClick={handleClearSelections}>Clear Selections</MenuItem>
      <MenuItem onClick={handleGroup} disabled={!groupEnabled}>
        Group
      </MenuItem>
      <MenuItem onClick={handleUngroup} disabled={!ungroupEnabled}>
        Ungroup
      </MenuItem>
    </Menu>
  );
};

export default ContextMenu;
