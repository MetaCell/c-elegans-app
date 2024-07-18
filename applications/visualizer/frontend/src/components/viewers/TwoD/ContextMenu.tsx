// ContextMenu.tsx
import React from 'react';
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
        // Add your action 1 logic here
        workspace.clearSelectedNeurons();  // Example action
        onClose();
    };

    const handleAction2 = () => {
        console.log("Action 2 clicked");
        // Add your action 2 logic here
        onClose();
    };


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
            <MenuItem onClick={handleAction2}>Action 2</MenuItem>
        </Menu>
    );
};

export default ContextMenu;
