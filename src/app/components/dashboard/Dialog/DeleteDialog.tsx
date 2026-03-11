import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

interface DeleteDialogProps {
  open: boolean;
  selectedDeleteCount: number;
  selectedCardTitle: string;
  onClose: () => void;
  onDelete: () => void;
}

const DeleteDialog = ({
  open,
  selectedDeleteCount,
  selectedCardTitle,
  onClose,
  onDelete,
}: DeleteDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="delete-items-dialog-title">
      <DialogTitle id="delete-items-dialog-title">Borrar elementos</DialogTitle>
      <DialogContent>
        <Typography>
          {selectedDeleteCount === 1
            ? `¿Estás seguro de que deseas borrar el elemento ${selectedCardTitle}?`
            : `¿Estás seguro de que deseas borrar los ${selectedDeleteCount} elementos?`}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onDelete}>
          Borrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteDialog;