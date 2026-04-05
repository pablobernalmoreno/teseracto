"use client";

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
  const dialogDescription =
    selectedDeleteCount === 1
      ? `¿Estás seguro de que deseas borrar el elemento ${selectedCardTitle}?`
      : `¿Estás seguro de que deseas borrar los ${selectedDeleteCount} elementos?`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="dashboard-dialog"
      aria-labelledby="delete-items-dialog-title"
      aria-describedby="delete-items-dialog-description"
    >
      <DialogTitle id="delete-items-dialog-title">Borrar elementos</DialogTitle>
      <DialogContent>
        <Typography id="delete-items-dialog-description">{dialogDescription}</Typography>
      </DialogContent>
      <DialogActions>
        <Button className="dashboard-dialog-button--secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          className="dashboard-dialog-button--danger"
          color="error"
          variant="contained"
          onClick={onDelete}
        >
          Borrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteDialog;
