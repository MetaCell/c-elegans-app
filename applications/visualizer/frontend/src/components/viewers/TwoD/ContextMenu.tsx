import type React from "react";
import { useMemo } from "react";
import { Menu, MenuItem } from "@mui/material";
import { type NeuronGroup, ViewerType } from "../../../models";
import { calculateMeanPosition, calculateSplitPositions, isNeuronClass } from "../../../helpers/twoD/twoDHelpers.ts";
import { useSelectedWorkspace } from "../../../hooks/useSelectedWorkspace.ts";
import type { Position } from "cytoscape";
import type { GraphViewerData } from "../../../models/models.ts";

interface ContextMenuProps {
  open: boolean;
  onClose: () => void;
  position: { mouseX: number; mouseY: number } | null;
  setSplitJoinState: React.Dispatch<React.SetStateAction<{ split: Set<string>; join: Set<string> }>>;
  setHiddenNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ open, onClose, position, setSplitJoinState, setHiddenNodes }) => {
  const workspace = useSelectedWorkspace();

  const handleHide = () => {
    setHiddenNodes((prevHiddenNodes) => {
      const newHiddenNodes = new Set([...prevHiddenNodes]);
      workspace.selectedNeurons.forEach((neuronId) => {
        newHiddenNodes.add(neuronId);
      });
      return newHiddenNodes;
    });
    workspace.clearSelectedNeurons();
    onClose();
  };

  const handleGroup = () => {
    const newGroupId = `group_${Date.now()}`;
    const newGroupNeurons = new Set<string>();
    const groupsToDelete = new Set<string>();

    for (const neuronId of workspace.selectedNeurons) {
      const group = workspace.neuronGroups[neuronId];
      if (group) {
        for (const groupedNeuronId of group.neurons) {
          newGroupNeurons.add(groupedNeuronId);
        }
        groupsToDelete.add(neuronId);
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

    workspace.customUpdate((draft) => {
      draft.neuronGroups[newGroupId] = newGroup;
      groupsToDelete.forEach((groupId) => delete draft.neuronGroups[groupId]);
      draft.selectedNeurons.clear();
      draft.selectedNeurons.add(newGroupId);
    });
    onClose();
  };

  const handleUngroup = () => {
    workspace.customUpdate((draft) => {
      const nextSelected = new Set<string>();
      for (const elementId of draft.selectedNeurons) {
        if (draft.neuronGroups[elementId]) {
          const group = draft.neuronGroups[elementId];
          for (const groupedNeuronId of group.neurons) {
            nextSelected.add(groupedNeuronId);
          }
          delete draft.neuronGroups[elementId];
        }
      }
      draft.selectedNeurons = nextSelected;
    });
    onClose();
  };

  const handleSplit = () => {
    setSplitJoinState((prevState) => {
      const newSplit = new Set(prevState.split);
      const newJoin = new Set(prevState.join);

      const newSelectedNeurons = new Set(workspace.selectedNeurons);
      const graphViewDataUpdates: Record<string, { position?: Position | null; visibility: boolean }> = {};

      workspace.selectedNeurons.forEach((neuronId) => {
        if (isNeuronClass(neuronId, workspace)) {
          newSplit.add(neuronId);
          newSelectedNeurons.delete(neuronId);

          const individualNeurons = Object.values(workspace.availableNeurons)
            .filter((neuron) => {
              return neuron.nclass === neuronId && neuron.nclass !== neuron.name;
            })
            .map((neuron) => neuron.name);

          // Calculate the positions for the individual neurons
          const basePosition = workspace.availableNeurons[neuronId].viewerData[ViewerType.Graph]?.defaultPosition || {
            x: 0,
            y: 0,
          };
          const positions = calculateSplitPositions(individualNeurons, basePosition);

          // Update the selected neurons with individual neurons
          individualNeurons.forEach((neuronName) => {
            newSelectedNeurons.add(neuronName);
            // Only set the position if it doesn't exist yet
            if (!workspace.availableNeurons[neuronName].viewerData[ViewerType.Graph]?.defaultPosition) {
              graphViewDataUpdates[neuronName] = { position: positions[neuronName], visibility: true };
            } else {
              graphViewDataUpdates[neuronName] = { visibility: true };
            }
          });

          // Remove the corresponding class from the toJoin set
          newJoin.forEach((joinNeuronId) => {
            if (workspace.availableNeurons[joinNeuronId].nclass === neuronId) {
              newJoin.delete(joinNeuronId);
            }
          });

          graphViewDataUpdates[neuronId] = { visibility: false };
        }
      });

      // Update the selected neurons in the workspace
      updateWorkspace(newSelectedNeurons, graphViewDataUpdates);

      return { split: newSplit, join: newJoin };
    });
    onClose();
  };

  const handleJoin = () => {
    setSplitJoinState((prevState) => {
      const newJoin = new Set(prevState.join);
      const newSplit = new Set(prevState.split);

      const newSelectedNeurons = new Set(workspace.selectedNeurons);
      const graphViewDataUpdates: Record<string, { position?: Position | null; visibility: boolean }> = {};

      workspace.selectedNeurons.forEach((neuronId) => {
        const neuronClass = workspace.availableNeurons[neuronId].nclass;

        const individualNeurons = Object.values(workspace.availableNeurons).filter((neuron) => neuron.nclass === neuronClass && neuron.name !== neuronClass);
        const individualNeuronIds = individualNeurons.map((neuron) => neuron.name);

        // Calculate and set the class position if not set already
        const classPosition = calculateMeanPosition(individualNeuronIds, workspace);

        if (!workspace.availableNeurons[neuronClass].viewerData[ViewerType.Graph]?.defaultPosition) {
          graphViewDataUpdates[neuronClass] = { position: classPosition, visibility: true };
        } else {
          graphViewDataUpdates[neuronClass] = { ...graphViewDataUpdates[neuronClass], visibility: true };
        }
        // Remove the individual neurons from the selected neurons and add the class neuron
        individualNeuronIds.forEach((neuronName) => {
          newSelectedNeurons.delete(neuronName);
          newJoin.add(neuronName);

          // Set individual neurons' visibility to false
          graphViewDataUpdates[neuronName] = { visibility: false };
        });
        newSelectedNeurons.add(neuronClass);

        // Remove the corresponding cells from the toSplit set
        newSplit.forEach((splitNeuronId) => {
          if (workspace.availableNeurons[splitNeuronId].nclass === neuronClass) {
            newSplit.delete(splitNeuronId);
          }
        });
      });

      // Update the selected neurons in the workspace
      updateWorkspace(newSelectedNeurons, graphViewDataUpdates);

      return { split: newSplit, join: newJoin };
    });
    onClose();
  };

  const updateWorkspace = (newSelectedNeurons: Set<string>, graphViewDataUpdates: Record<string, Partial<GraphViewerData>>) => {
    workspace.customUpdate((draft) => {
      // Update the selected neurons
      draft.selectedNeurons = newSelectedNeurons;

      // Update the positions and visibility for the individual neurons and class neuron
      Object.entries(graphViewDataUpdates).forEach(([neuronName, update]) => {
        if (draft.availableNeurons[neuronName]) {
          if (update.defaultPosition !== undefined) {
            draft.availableNeurons[neuronName].viewerData[ViewerType.Graph].defaultPosition = update.defaultPosition;
          }
          draft.availableNeurons[neuronName].viewerData[ViewerType.Graph].visibility = update.visibility;
        }
      });
    });
  };

  const handleAddToWorkspace = () => {
    workspace.customUpdate((draft) => {
      workspace.selectedNeurons.forEach((neuronId) => {
        const group = workspace.neuronGroups[neuronId];
        if (group) {
          group.neurons.forEach((groupedNeuronId) => {
            draft.activeNeurons.add(groupedNeuronId);
          });
        } else {
          draft.activeNeurons.add(neuronId);
        }
      });
    });
    onClose();
  };

  const groupEnabled = useMemo(() => {
    return Array.from(workspace.selectedNeurons).some((neuronId) => !workspace.neuronGroups[neuronId]);
  }, [workspace.selectedNeurons, workspace.neuronGroups]);

  const ungroupEnabled = useMemo(() => {
    return Array.from(workspace.selectedNeurons).some((neuronId) => workspace.neuronGroups[neuronId]);
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
      <MenuItem onClick={handleHide}>Hide</MenuItem>
      <MenuItem onClick={handleGroup} disabled={!groupEnabled}>
        Group
      </MenuItem>
      <MenuItem onClick={handleUngroup} disabled={!ungroupEnabled}>
        Ungroup
      </MenuItem>
      <MenuItem onClick={handleJoin} disabled={!joinEnabled}>
        Join Left-Right
      </MenuItem>
      <MenuItem onClick={handleSplit} disabled={!splitEnabled}>
        Split Left-Right
      </MenuItem>
      <MenuItem onClick={handleAddToWorkspace}>Add to Workspace</MenuItem>
    </Menu>
  );
};

export default ContextMenu;
