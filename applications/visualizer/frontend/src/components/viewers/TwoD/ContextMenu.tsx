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
import {Box, Divider, Menu, MenuItem} from "@mui/material";
import type {Core, Position} from "cytoscape";
import type React from "react";
import {useMemo, useState} from "react";
import {calculateMeanPosition, calculateSplitPositions, isNeuronClass} from "../../../helpers/twoD/twoDHelpers.ts";
import {useSelectedWorkspace} from "../../../hooks/useSelectedWorkspace.ts";
import {
    AlignBottomIcon,
    AlignLeftIcon,
    AlignRightIcon,
    AlignTopIcon,
    DistributeHorizontallyIcon,
    DistributeVerticallyIcon
} from "../../../icons";
import {Alignment, type NeuronGroup, ViewerType} from "../../../models";
import {Visibility} from "../../../models/models.ts";
import {vars} from "../../../theme/variables.ts";
import {alignNeurons, distributeNeurons} from "../../../helpers/twoD/alignHelper.ts";
import {removeNodeFromGroup} from "../../../helpers/twoD/graphRendering.ts";
import {processNeuronJoin, processNeuronSplit} from "../../../helpers/twoD/splitJoinHelper.ts";

const {gray700} = vars;

interface ContextMenuProps {
    open: boolean;
    onClose: () => void;
    position: { mouseX: number; mouseY: number } | null;
    setSplitJoinState: React.Dispatch<React.SetStateAction<{ split: Set<string>; join: Set<string> }>>;
    openGroups: Set<string>;
    setOpenGroups: React.Dispatch<React.SetStateAction<Set<string>>>;
    cy: Core
}


const ContextMenu: React.FC<ContextMenuProps> = ({
                                                     open,
                                                     onClose,
                                                     position,
                                                     setSplitJoinState,
                                                     openGroups,
                                                     setOpenGroups,
                                                     cy
                                                 }) => {
    const workspace = useSelectedWorkspace();
    const [submenuOpen, setSubmenuOpen] = useState(false);
    const [submenuAnchorEl, setSubmenuAnchorEl] = useState<null | HTMLElement>(null);

    const handleAlignClick = (event: React.MouseEvent<HTMLElement>) => {
        setSubmenuAnchorEl(event.currentTarget);
        setSubmenuOpen(true);
    };

    const handleSubmenuClose = () => {
        setSubmenuAnchorEl(null);
        setSubmenuOpen(false);
    };

    const handleAlignOption = (option: Alignment) => {
        alignNeurons(option, Array.from(workspace.selectedNeurons), cy);
        handleSubmenuClose();
        onClose();
    };

    const handleDistributeOption = (option: Alignment) => {
        distributeNeurons(option, Array.from(workspace.selectedNeurons), cy);
        handleSubmenuClose();
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
        const groupsToRemoveFromOpen = new Set<string>();

        workspace.customUpdate((draft) => {
            const nextSelected = new Set<string>();
            for (const elementId of draft.selectedNeurons) {
                if (draft.neuronGroups[elementId]) {
                    const group = draft.neuronGroups[elementId];
                    for (const groupedNeuronId of group.neurons) {
                        nextSelected.add(groupedNeuronId);
                        removeNodeFromGroup(cy, groupedNeuronId, true);
                    }
                    delete draft.neuronGroups[elementId];
                    if (openGroups.has(elementId)) {
                        groupsToRemoveFromOpen.add(elementId);
                    }
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
        return Array.from(workspace.selectedNeurons).some((neuronId) => {
            // Check if the neuronId is not a group and is not part of any group
            const isGroup = Boolean(workspace.neuronGroups[neuronId]);
            const isPartOfGroup = Object.values(workspace.neuronGroups).some(group => group.neurons.has(neuronId));

            return !isGroup && !isPartOfGroup;
        });
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


    const openGroupEnabled = useMemo(() => {
        return Array.from(workspace.selectedNeurons).some(
            (neuronId) => workspace.neuronGroups[neuronId] && !openGroups.has(neuronId)
        );
    }, [workspace.selectedNeurons, workspace.neuronGroups, openGroups]);

    const closeGroupEnabled = useMemo(() => {
        return Array.from(workspace.selectedNeurons).some(
            (neuronId) => workspace.neuronGroups[neuronId] && openGroups.has(neuronId)
        );
    }, [workspace.selectedNeurons, workspace.neuronGroups, openGroups]);
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
            sx={{
                "& .MuiMenuItem-root": {
                    color: gray700,
                },
            }}
        >
            <MenuItem onClick={handleHide}>
                <VisibilityOutlined fontSize="small"/>
                Hide
            </MenuItem>
            <MenuItem onClick={handleAddToWorkspace}>
                <HubOutlined fontSize="small"/>
                Add to Workspace
            </MenuItem>
            {joinEnabled && (
                <MenuItem onClick={handleJoin} disabled={!joinEnabled}>
                    <MergeOutlined fontSize="small"/>
                    Join Left-Right
                </MenuItem>
            )}
            {splitEnabled && (
                <MenuItem onClick={handleSplit} disabled={!splitEnabled}>
                    <CallSplitOutlined fontSize="small"/>
                    Split Left-Right
                </MenuItem>
            )}

            <Divider/>
            {groupEnabled && (
                <MenuItem onClick={handleGroup} disabled={!groupEnabled}>
                    <GroupOutlined fontSize="small"/>
                    Group
                </MenuItem>
            )}
            {ungroupEnabled && (
                <MenuItem onClick={handleUngroup} disabled={!ungroupEnabled}>
                    <WorkspacesOutlined fontSize="small"/>
                    Ungroup
                </MenuItem>
            )}
            {openGroupEnabled && (
                <MenuItem onClick={handleOpenGroup} disabled={!openGroupEnabled}>
                    <OpenInFull fontSize="small"/>
                    Open Group
                </MenuItem>
            )}
            {closeGroupEnabled && (
                <MenuItem onClick={handleCloseGroup} disabled={!closeGroupEnabled}>
                    <CloseFullscreen fontSize="small" style={{transform: 'rotate(180deg)'}}/>
                    Close Group
                </MenuItem>
            )}
            <MenuItem onClick={handleAlignClick}>
                <FormatAlignJustifyOutlined fontSize="small"/>
                <Box width={1} display="flex" alignItems="center" justifyContent="space-between">
                    Align
                    <ArrowRightOutlined/>
                </Box>
            </MenuItem>
            <Menu
                anchorEl={submenuAnchorEl}
                open={submenuOpen}
                onClose={handleSubmenuClose}
                anchorOrigin={{vertical: "top", horizontal: "right"}}
                transformOrigin={{vertical: "top", horizontal: "left"}}
                MenuListProps={{onMouseLeave: handleSubmenuClose}}
            >
                <MenuItem onClick={() => handleAlignOption(Alignment.Left)}>
                    <AlignLeftIcon/>
                    Align left
                </MenuItem>
                <MenuItem onClick={() => handleAlignOption(Alignment.Right)}>
                    <AlignRightIcon/>
                    Align right
                </MenuItem>
                <MenuItem onClick={() => handleAlignOption(Alignment.Top)}>
                    <AlignTopIcon/>
                    Align top
                </MenuItem>
                <MenuItem onClick={() => handleAlignOption(Alignment.Bottom)}>
                    <AlignBottomIcon/>
                    Align bottom
                </MenuItem>
                <Divider/>
                <MenuItem onClick={() => handleDistributeOption(Alignment.Horizontal)}>
                    <DistributeHorizontallyIcon/>
                    Distribute horizontally
                </MenuItem>
                <MenuItem onClick={() => handleDistributeOption(Alignment.Vertical)}>
                    <DistributeVerticallyIcon/>
                    Distribute vertically
                </MenuItem>
            </Menu>
        </Menu>
    );
};

export default ContextMenu;
