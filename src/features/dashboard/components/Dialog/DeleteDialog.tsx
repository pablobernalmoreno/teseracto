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
      ? `¿Seguro que quieres eliminar la planilla ${selectedCardTitle}?`
      : `¿Seguro que quieres eliminar las ${selectedDeleteCount} planillas?`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="dashboard-dialog"
      aria-labelledby="delete-items-dialog-title"
      aria-describedby="delete-items-dialog-description"
    >
      <DialogTitle id="delete-items-dialog-title">Eliminar planillas</DialogTitle>
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
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteDialog;
