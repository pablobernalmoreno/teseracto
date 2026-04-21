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

interface UnsavedChangesDialogProps {
  open: boolean;
  hasUnsavedChanges: boolean;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
}

const UnsavedChangesDialog = ({
  open,
  hasUnsavedChanges,
  onClose,
  onSave,
  onDiscard,
}: UnsavedChangesDialogProps) => {
  const saveLabel = hasUnsavedChanges ? "Guardar y salir *" : "Guardar y salir";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="dashboard-dialog"
      aria-labelledby="unsaved-changes-dialog-title"
      aria-describedby="unsaved-changes-dialog-description"
    >
      <DialogTitle id="unsaved-changes-dialog-title">Cambios sin guardar</DialogTitle>
      <DialogContent>
        <Typography id="unsaved-changes-dialog-description">
          Tienes cambios sin guardar. ¿Deseas guardarlos antes de salir?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button className="dashboard-dialog-button--secondary" onClick={onClose}>
          Seguir editando
        </Button>
        <Button className="dashboard-dialog-button--secondary" onClick={onDiscard}>
          Ignorar cambios
        </Button>
        <Button className="dashboard-dialog-button--primary" variant="contained" onClick={onSave}>
          {saveLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnsavedChangesDialog;
