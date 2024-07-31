import React, {useMemo} from "react";
import {Menu, MenuItem} from "@mui/material";
import {NeuronGroup, Workspace} from "../../../models";
import {isNeuronClass} from "../../../helpers/twoD/twoDHelpers.ts";
import {useSelectedWorkspace} from "../../../hooks/useSelectedWorkspace.ts";

interface ContextMenuProps {
    open: boolean;
    onClose: () => void;
    position: { mouseX: number; mouseY: number } | null;
    setSplitJoinState: React.Dispatch<React.SetStateAction<{ split: Set<string>; join: Set<string> }>>;
    setHiddenNodes: React.Dispatch<React.SetStateAction<Set<string>>>;

}

const ContextMenu: React.FC<ContextMenuProps> = ({
                                                     open,
                                                     onClose,
                                                     position,
                                                     setSplitJoinState,
                                                     setHiddenNodes
                                                 }) => {

    const workspace = useSelectedWorkspace();

    const handleHide = () => {
        setHiddenNodes((prevHiddenNodes) => {
            const newHiddenNodes = new Set([...prevHiddenNodes]);
            workspace.selectedNeurons.forEach(neuronId => {
                newHiddenNodes.add(neuronId);
            });
            return newHiddenNodes;
        });
        workspace.clearSelectedNeurons()
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

        workspace.customUpdate(draft => {
            draft.neuronGroups[newGroupId] = newGroup;
            groupsToDelete.forEach(groupId => delete draft.neuronGroups[groupId]);
            draft.selectedNeurons.clear();
            draft.selectedNeurons.add(newGroupId);
        });
        onClose();
    };

    const handleUngroup = () => {
        workspace.customUpdate(draft => {
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

            const newSelectedNeurons = new Set(workspace.selectedNeurons);

            workspace.selectedNeurons.forEach(neuronId => {
                if (isNeuronClass(neuronId, workspace)) {
                    newSplit.add(neuronId);
                    newSelectedNeurons.delete(neuronId);

                    // Add the individual neurons to the selected neurons
                    Object.values(workspace.availableNeurons).forEach(neuron => {
                        if (neuron.nclass === neuronId && neuron.nclass !== neuron.name) {
                            newSelectedNeurons.add(neuron.name);
                        }
                    });

                    // Remove the corresponding class from the toJoin set
                    newJoin.forEach(joinNeuronId => {
                        if (workspace.availableNeurons[joinNeuronId].nclass === neuronId) {
                            newJoin.delete(joinNeuronId);
                        }
                    });
                }
            });

            // Update the selected neurons in the workspace
            workspace.customUpdate(draft => {
                draft.selectedNeurons = newSelectedNeurons;
            });

            return {split: newSplit, join: newJoin};
        });
        onClose();
    };

    const handleJoin = () => {
        setSplitJoinState((prevState) => {
            const newJoin = new Set(prevState.join);
            const newSplit = new Set(prevState.split);

            const newSelectedNeurons = new Set(workspace.selectedNeurons);

            workspace.selectedNeurons.forEach(neuronId => {
                const neuronClass = workspace.availableNeurons[neuronId].nclass;

                // Remove the individual neurons from the selected neurons and add the class neuron
                Object.values(workspace.availableNeurons).forEach(neuron => {
                    if (neuron.nclass === neuronClass && neuron.name !== neuronClass) {
                        newSelectedNeurons.delete(neuron.name);
                        newJoin.add(neuron.name);
                    }
                });
                newSelectedNeurons.add(neuronClass);

                // Remove the corresponding cells from the toSplit set
                newSplit.forEach(splitNeuronId => {
                    if (workspace.availableNeurons[splitNeuronId].nclass === neuronClass) {
                        newSplit.delete(splitNeuronId);
                    }
                });
            });

            // Update the selected neurons in the workspace
            workspace.customUpdate(draft => {
                draft.selectedNeurons = newSelectedNeurons;
            });

            return {split: newSplit, join: newJoin};
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
            anchorPosition={position !== null ? {top: position.mouseY, left: position.mouseX} : undefined}
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
