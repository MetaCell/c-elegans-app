// ContextMenu.tsx
import React, { useMemo } from 'react';
import { Menu, MenuItem } from '@mui/material';

interface ContextMenuProps {
    open: boolean;
    onClose: () => void;
    workspace: any;
    position: { mouseX: number, mouseY: number } | null;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ open, onClose, workspace, position }) => {

    const handleAction1 = () => {
        console.log("Action 1 clicked");
        workspace.clearSelectedNeurons();  // Example action
        onClose();
    };

    const handleJoin = () => {
        console.log("Join clicked");
        // Implement join logic here
        onClose();
    };

    const handleSplit = () => {
        console.log("Split clicked");
        // Implement split logic here
        onClose();
    };

    const joinEnabled = useMemo(() => {
        return Array.from(workspace.selectedNeurons).some(neuronId => {
            const neuron = workspace.availableNeurons[neuronId];
            return neuron && neuron.name !== neuron.nclass;
        });
    }, [workspace.selectedNeurons, workspace.availableNeurons]);

    const splitEnabled = useMemo(() => {
        return Array.from(workspace.selectedNeurons).some(neuronId => {
            const neuron = workspace.availableNeurons[neuronId];
            return neuron && neuron.name === neuron.nclass;
        });
    }, [workspace.selectedNeurons, workspace.availableNeurons]);


    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault(); // Prevent default context menu
    };

    return (
        <Menu
            anchorReference="anchorPosition"
            anchorPosition={
                position !== null
                    ? { top: position.mouseY, left: position.mouseX }
                    : undefined
            }
            open={open}
            onClose={onClose}
            onContextMenu={handleContextMenu}
        >
            <MenuItem onClick={handleAction1}>Clear Selections</MenuItem>
            <MenuItem onClick={handleJoin} disabled={!joinEnabled}>Join</MenuItem>
            <MenuItem onClick={handleSplit} disabled={!splitEnabled}>Split</MenuItem>
        </Menu>
    );
};

export default ContextMenu;
