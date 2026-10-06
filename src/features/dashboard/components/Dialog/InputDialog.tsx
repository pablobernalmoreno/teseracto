"use client";

import { useState } from "react";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { DialogState } from "@/features/dashboard/model/useItemCardModel";
import type { EntryIssues } from "@/features/dashboard/model/reviewEntries";
import type { MainData } from "@/types/dashboard";
import { InvalidEntryCarousel } from "../InvalidEntryCarousel/InvalidEntryCarousel";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  Typography,
} from "@mui/material";
import styles from "./InputDialog.module.css";

export interface InputDialogProps {
  open: boolean;
  dialogState: DialogState;
  // The entries to review, with their current date and amount.
  attentionEntries: MainData[];
  entryIssues: Record<number, EntryIssues>;
  sources: string[];
  // Title the book will get from the dates as they stand now.
  rangeTitle: string;
  canSave: boolean;
  activeEntryId: number | null;
  // Why the last save failed; the review stays open so the user can retry.
  saveError?: string | null;
  onClose: () => void;
  onSave: () => Promise<void> | void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onActiveEntryChange: (entryId: number) => void;
  onDateChange: (entryId: number, value: string) => void;
  onMoneyChange: (entryId: number, value: string) => void;
  onConfirmDate: (entryId: number) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export const InputDialog: React.FC<InputDialogProps> = ({
  open,
  dialogState,
  attentionEntries,
  entryIssues,
  sources,
  rangeTitle,
  canSave,
  activeEntryId,
  saveError,
  onClose,
  onSave,
  onFileChange,
  onActiveEntryChange,
  onDateChange,
  onMoneyChange,
  onConfirmDate,
  inputRef,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveClick = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDialogClose = (_event: object, reason?: "backdropClick" | "escapeKeyDown") => {
    if (isSaving && (reason === "backdropClick" || reason === "escapeKeyDown")) {
      return;
    }

    onClose();
  };

  // Follow the active entry by id; an id that is gone (or none yet) falls back to the first entry.
  const currentIndex = Math.max(
    attentionEntries.findIndex((entry) => entry.id === activeEntryId),
    0
  );

  // Render content based on current state
  const renderContent = () => {
    switch (dialogState.type) {
      case "loading":
        return (
          <Box className={styles.loadingContainer}>
            <CircularProgress />
          </Box>
        );

      case "invalid_entries":
        return (
          <Box className={styles.invalidEntriesContainer}>
            <InvalidEntryCarousel
              entries={attentionEntries}
              sources={sources}
              currentIndex={currentIndex}
              entryIssues={entryIssues}
              rangeTitle={rangeTitle}
              onDateChange={onDateChange}
              onMoneyChange={onMoneyChange}
              onConfirmDate={onConfirmDate}
              onPrev={() => {
                const previous = attentionEntries[Math.max(0, currentIndex - 1)];
                if (previous) onActiveEntryChange(previous.id);
              }}
              onNext={() => {
                const next =
                  attentionEntries[Math.min(attentionEntries.length - 1, currentIndex + 1)];
                if (next) onActiveEntryChange(next.id);
              }}
            />
          </Box>
        );

      case "success":
        return (
          <Box className={styles.successContainer}>
            <Fade in={true} timeout={500}>
              <CheckCircleIcon className={styles.successIcon} />
            </Fade>
          </Box>
        );

      case "idle":
      default:
        return (
          <Box className={styles.idleContainer}>
            <Typography id="upload-dialog-description" sx={{ textAlign: "center" }}>
              Selecciona una o varias imágenes para continuar.
            </Typography>
            <Button
              className={styles.uploadButton}
              component="label"
              variant="text"
              startIcon={<CloudUploadIcon />}
              onClick={(e) => e.stopPropagation()}
            >
              <span>Subir Archivos</span>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*"
                className="file_upload_hidden_input"
                onChange={onFileChange}
              />
            </Button>
          </Box>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="alert-dialog-title"
      aria-describedby="upload-dialog-description"
      className="dashboard-dialog"
    >
      <DialogTitle id="alert-dialog-title">Subir Archivo</DialogTitle>
      <DialogContent
        className={`file_upload_container ${styles.dialogContent} ${
          dialogState.type === "idle" ? styles.dialogContentClickable : ""
        }`}
        onClick={() => dialogState.type === "idle" && inputRef.current?.click()}
        {...(dialogState.type === "idle" && {
          role: "button",
          tabIndex: 0,
          "aria-label": "Seleccionar archivos para subir",
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          },
        })}
      >
        {renderContent()}
      </DialogContent>
      {saveError && (
        <Alert severity="error" sx={{ mx: 3 }}>
          {saveError}
        </Alert>
      )}
      <DialogActions className={styles.dialogActions}>
        <Button
          className="dashboard-dialog-button dashboard-dialog-button--secondary"
          onClick={onClose}
          disabled={isSaving}
        >
          Cancelar
        </Button>
        <Button
          className="dashboard-dialog-button dashboard-dialog-button--primary"
          onClick={handleSaveClick}
          autoFocus
          disabled={isSaving || !canSave}
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
