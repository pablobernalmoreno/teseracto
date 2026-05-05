"use client";

import { useMemo, useState } from "react";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { DialogState } from "@/features/dashboard/model/useItemCardModel";
import type { MainData } from "@/types/dashboard";
import { CarouselValues, InvalidEntryCarousel } from "../InvalidEntryCarousel/InvalidEntryCarousel";
import {
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
  invalidEntries: MainData[];
  sources: string[];
  carouselValues: CarouselValues;
  selectedDate: string;
  excludedEntryIds: Set<number>;
  dateMismatchEntryIds: Set<number>;
  entryMessages: Record<number, string>;
  onClose: () => void;
  onSave: () => Promise<void> | void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMoneyChange: (entryId: number, value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export const InputDialog: React.FC<InputDialogProps> = ({
  open,
  dialogState,
  invalidEntries,
  sources,
  carouselValues,
  selectedDate,
  excludedEntryIds,
  dateMismatchEntryIds,
  entryMessages,
  onClose,
  onSave,
  onFileChange,
  onMoneyChange,
  inputRef,
}) => {
  const excludedSet = excludedEntryIds;
  const dateMismatchSet = dateMismatchEntryIds;
  const [groupedCarouselIndex, setGroupedCarouselIndex] = useState(0);
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

  const groupedInvalidEntries = useMemo(() => {
    const firstDateMismatchId = invalidEntries.find((entry) => dateMismatchSet.has(entry.id))?.id;

    return invalidEntries.filter((entry) => {
      const isDateMismatchEntry = dateMismatchSet.has(entry.id);
      if (!isDateMismatchEntry) {
        return true;
      }

      return entry.id === firstDateMismatchId;
    });
  }, [invalidEntries, dateMismatchSet]);

  const maxGroupedIndex = Math.max(groupedInvalidEntries.length - 1, 0);
  const currentGroupedIndex = Math.min(groupedCarouselIndex, maxGroupedIndex);

  const dateMismatchCount = dateMismatchEntryIds.size;
  const activeInvalidEntry = groupedInvalidEntries[currentGroupedIndex];

  const allInvalidEntriesFilled = invalidEntries.every((entry) => {
    if (excludedSet.has(entry.id)) return true;
    const v = carouselValues[entry.id] || { money: "" };
    return Boolean(v.money);
  });

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
              invalidEntries={groupedInvalidEntries}
              sources={sources}
              currentIndex={currentGroupedIndex}
              carouselValues={carouselValues}
              selectedDate={selectedDate}
              isEntryExcluded={excludedSet.has(activeInvalidEntry?.id)}
              isDateMismatch={dateMismatchSet.has(activeInvalidEntry?.id)}
              dateMismatchCount={dateMismatchCount}
              entryMessage={entryMessages[activeInvalidEntry?.id]}
              onPrev={() => setGroupedCarouselIndex(Math.max(0, currentGroupedIndex - 1))}
              onNext={() =>
                setGroupedCarouselIndex(Math.min(maxGroupedIndex, currentGroupedIndex + 1))
              }
              onMoneyChange={onMoneyChange}
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
              Selecciona uno o varios archivos de imagen o PDF para continuar.
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
                accept="image/*,application/pdf"
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
          disabled={
            isSaving ||
            (dialogState.type !== "invalid_entries" && dialogState.type !== "success") ||
            !allInvalidEntriesFilled
          }
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
