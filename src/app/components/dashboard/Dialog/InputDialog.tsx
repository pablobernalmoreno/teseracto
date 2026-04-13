"use client";

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

export interface InputDialogProps {
  open: boolean;
  dialogState: DialogState;
  invalidEntries: MainData[];
  sources: string[];
  carouselIndex: number;
  carouselValues: CarouselValues;
  selectedDate: string;
  excludedEntryIds: number[];
  entryMessages: Record<number, string>;
  onClose: () => void;
  onSave: () => Promise<void> | void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrev: () => void;
  onNext: () => void;
  onMoneyChange: (entryId: number, value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export const InputDialog: React.FC<InputDialogProps> = ({
  open,
  dialogState,
  invalidEntries,
  sources,
  carouselIndex,
  carouselValues,
  selectedDate,
  excludedEntryIds,
  entryMessages,
  onClose,
  onSave,
  onFileChange,
  onPrev,
  onNext,
  onMoneyChange,
  inputRef,
}) => {
  const excludedSet = new Set(excludedEntryIds);
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
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        );

      case "invalid_entries":
        return (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
              flexDirection: "column",
              gap: 2,
            }}
          >
            <InvalidEntryCarousel
              invalidEntries={invalidEntries}
              sources={sources}
              currentIndex={carouselIndex}
              carouselValues={carouselValues}
              selectedDate={selectedDate}
              isEntryExcluded={excludedSet.has(invalidEntries[carouselIndex]?.id)}
              entryMessage={entryMessages[invalidEntries[carouselIndex]?.id]}
              onPrev={onPrev}
              onNext={onNext}
              onMoneyChange={onMoneyChange}
            />
          </Box>
        );

      case "success":
        return (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Fade in={true} timeout={500}>
              <CheckCircleIcon style={{ fontSize: 80, color: "#4caf50" }} />
            </Fade>
          </Box>
        );

      case "idle":
      default:
        return (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography id="upload-dialog-description" textAlign="center">
              Selecciona uno o varios archivos de imagen o PDF para continuar.
            </Typography>
            <Button component="label" variant="text" startIcon={<CloudUploadIcon />}>
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
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="alert-dialog-title"
      aria-describedby="upload-dialog-description"
      className="dashboard-dialog"
    >
      <DialogTitle id="alert-dialog-title">Subir Archivo</DialogTitle>
      <DialogContent className="file_upload_container" sx={{ overflow: "visible" }}>
        {renderContent()}
      </DialogContent>
      <DialogActions>
        <Button
          className="dashboard-dialog-button dashboard-dialog-button--ghost"
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button
          className="dashboard-dialog-button dashboard-dialog-button--solid"
          onClick={onSave}
          autoFocus
          disabled={
            (dialogState.type !== "invalid_entries" && dialogState.type !== "success") ||
            !allInvalidEntriesFilled
          }
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
