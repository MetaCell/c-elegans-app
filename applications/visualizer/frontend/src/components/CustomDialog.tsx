import { Box, Dialog, IconButton, Typography } from "@mui/material";
import type React from "react";
import { CloseIcon } from "../icons";
import { vars } from "../theme/variables.ts";

const { gray100 } = vars;
interface CustomDialogProps {
  onClose: () => void;
  showModal: boolean;
  title: string;
  children: React.ReactNode;
}

const CustomDialog = ({ onClose, showModal, title, children }: CustomDialogProps) => {
  return (
    <Dialog
      onClose={onClose}
      open={showModal}
      sx={{
        "& .MuiBackdrop-root": {
          background: "rgba(0,0,0,0.25)",
        },
      }}
      fullWidth
      maxWidth="lg"
    >
      <Box borderBottom={`0.0625rem solid ${gray100}`} px="1rem" py="0.5rem" display="flex" alignItems="center" justifyContent="space-between">
        <Typography component="h3">{title}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      {children}
    </Dialog>
  );
};

export default CustomDialog;
