import React, {useMemo} from "react";
import {Menu, MenuItem} from "@mui/material";
import {NeuronGroup, Workspace} from "../../../models";
import {isClass} from "../../../helpers/twoD/twoDHelpers.ts";

interface ContextMenuProps {
    open: boolean;
    onClose: () => void;
    workspace: Workspace;
    position: { mouseX: number; mouseY: number } | null;
    setSplitJoinState: React.Dispatch<React.SetStateAction<{ split: Set<string>; join: Set<string> }>>;
}

const ContextMenu: React.FC<ContextMenuProps> = ({open, onClose, workspace, position, setSplitJoinState}) => {
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

    const handleSplit = () => {
        setSplitJoinState((prevState) => {
            const newSplit = new Set(prevState.split);
            const newJoin = new Set(prevState.join);

            workspace.selectedNeurons.forEach(neuronId => {
                if (isClass(neuronId, workspace)) {
                    newSplit.add(neuronId);
                    // Remove the corresponding class from the toJoin set
                    newJoin.forEach(joinNeuronId => {
                        if (workspace.availableNeurons[joinNeuronId].nclass === neuronId) {
                            newJoin.delete(joinNeuronId);
                        }
                    });
                }
            });

            return {split: newSplit, join: newJoin};
        });
        onClose();
    };

    const handleJoin = () => {
        setSplitJoinState((prevState) => {
            const newJoin = new Set(prevState.join);
            const newSplit = new Set(prevState.split);

            workspace.selectedNeurons.forEach(neuronId => {
                const neuronClass = workspace.availableNeurons[neuronId].nclass;
                Object.values(workspace.availableNeurons).forEach(neuron => {
                    if (neuron.nclass === neuronClass && neuron.name !== neuron.nclass) {
                        newJoin.add(neuron.name);
                    }
                });

                // Remove the corresponding cells from the toSplit set
                newSplit.forEach(splitNeuronId => {
                    if (workspace.availableNeurons[splitNeuronId].nclass === neuronClass) {
                        newSplit.delete(splitNeuronId);
                    }
                });
            });

            return {split: newSplit, join: newJoin};
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
            anchorPosition={position !== null ? {top: position.mouseY, left: position.mouseX} : undefined}
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
            <MenuItem onClick={handleJoin} disabled={!joinEnabled}>
                Join Left-Right
            </MenuItem>
            <MenuItem onClick={handleSplit} disabled={!splitEnabled}>
                Split Left-Right
            </MenuItem>
        </Menu>
    );
};

export default ContextMenu;
