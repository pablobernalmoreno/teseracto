"use client";

import { useState, type CSSProperties } from "react";
import type { MainData } from "@/types/dashboard";
import { Dialog, DialogContent, Fade, IconButton, TextField, Typography } from "@mui/material";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CloseIcon from "@mui/icons-material/Close";
import Image from "next/image";
import styles from "./InvalidEntryCarousel.module.css";

export interface CarouselValues {
  [entryId: number]: {
    money: string;
  };
}

interface InvalidEntryCarouselProps {
  invalidEntries: MainData[];
  sources: string[];
  currentIndex: number;
  carouselValues: CarouselValues;
  selectedDate: string;
  isEntryExcluded: boolean;
  isDateMismatch: boolean;
  dateMismatchCount: number;
  entryMessage?: string;
  onDateChange: (value: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onMoneyChange: (entryId: number, value: string) => void;
}

function getEntryMessageNode(
  isDateMismatch: boolean,
  dateMismatchCount: number,
  selectedDate: string,
  entryMessage: string | undefined,
  isEntryExcluded: boolean
): React.ReactNode {
  if (isDateMismatch) {
    return (
      <Typography color="error" className={styles.messageText}>
        {dateMismatchCount} imágenes no correspondían con la fecha elegida: {selectedDate || "No detectada"}, por lo que no serán agregadas.
      </Typography>
    );
  }

  if (!entryMessage) {
    return null;
  }

  return (
    <Typography
      color={isEntryExcluded ? "error" : undefined}
      sx={isEntryExcluded ? undefined : { color: "warning.main" }}
      className={styles.messageText}
    >
      {entryMessage}
    </Typography>
  );
}

function getMoneyFieldValue(currentMoney: string, entryMoney: string): string {
  if (currentMoney) {
    return currentMoney;
  }

  return entryMoney === "N/A" ? "" : entryMoney;
}

function getFirstImageDatePromptNode(shouldPromptFirstImageDate: boolean): React.ReactNode {
  if (!shouldPromptFirstImageDate) {
    return null;
  }

  return (
    <Typography sx={{ color: "warning.main" }} className={styles.messageText}>
      Define la fecha en la primera imagen para aplicarla a todas las imágenes de este lote.
    </Typography>
  );
}

export const InvalidEntryCarousel: React.FC<InvalidEntryCarouselProps> = ({
  invalidEntries,
  sources,
  currentIndex,
  carouselValues,
  selectedDate,
  isEntryExcluded,
  isDateMismatch,
  dateMismatchCount,
  entryMessage,
  onDateChange,
  onPrev,
  onNext,
  onMoneyChange,
}) => {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const minZoomLevel = 1;
  const maxZoomLevel = 3;
  const zoomStep = 0.25;

  const increaseZoom = () => {
    setZoomLevel((prev) => Math.min(maxZoomLevel, Number((prev + zoomStep).toFixed(2))));
  };

  const decreaseZoom = () => {
    setZoomLevel((prev) => Math.max(minZoomLevel, Number((prev - zoomStep).toFixed(2))));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  const openZoom = () => {
    setZoomLevel(1);
    setIsZoomOpen(true);
  };

  const closeZoom = () => {
    setIsZoomOpen(false);
    setZoomLevel(1);
  };

  const handlePrev = () => {
    closeZoom();
    onPrev();
  };

  const handleNext = () => {
    closeZoom();
    onNext();
  };

  const entry = invalidEntries[currentIndex];
  const source = entry ? sources[entry.id] : undefined;
  const currentValues = entry ? carouselValues[entry.id] || { money: "" } : { money: "" };
  const shouldRenderImage = Boolean(source) && !isDateMismatch;
  const shouldShowNavigation = invalidEntries.length > 1;
  const needsManualDate = !selectedDate.trim() && !isDateMismatch && currentIndex === 0;
  const shouldPromptFirstImageDate = !selectedDate.trim() && !isDateMismatch && currentIndex > 0;

  if (!invalidEntries.length || !entry) return null;

  const zoomStyle = { "--zoom-width": `${zoomLevel * 100}%` } as CSSProperties;
  const messageNode = getEntryMessageNode(
    isDateMismatch,
    dateMismatchCount,
    selectedDate,
    entryMessage,
    isEntryExcluded
  );
  const moneyFieldValue = getMoneyFieldValue(currentValues.money, entry.money);
  const firstImageDatePromptNode = getFirstImageDatePromptNode(shouldPromptFirstImageDate);

  return (
    <div className={styles.root}>
      {isDateMismatch ? null : (
        <Typography variant="h6">
          Entrada {currentIndex + 1} de {invalidEntries.length}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" className={styles.selectedDate}>
        Fecha seleccionada: {selectedDate || "No detectada"}
      </Typography>
      <Fade in={true} timeout={500}>
        <div className={styles.content}>
          {shouldRenderImage && source ? (
            <button
              type="button"
              onClick={openZoom}
              aria-label="Abrir vista ampliada de la imagen"
              className={styles.previewButton}
            >
              <Image
                src={source}
                alt={`Vista previa de la entrada inválida ${currentIndex + 1} de ${invalidEntries.length}`}
                width={180}
                height={180}
              />
            </button>
          ) : null}
          {messageNode}
          {isDateMismatch ? null : (
            <div className={styles.moneyRow}>
              {needsManualDate ? (
                <TextField
                  label="Fecha"
                  type="date"
                  variant="outlined"
                  size="small"
                  value={selectedDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  className={styles.moneyField}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              ) : null}
              <TextField
                key={`money-${currentIndex}`}
                label="Dinero"
                type="text"
                variant="outlined"
                size="small"
                value={moneyFieldValue}
                onChange={(e) => onMoneyChange(entry.id, e.target.value)}
                disabled={isEntryExcluded}
                className={styles.moneyField}
              />
            </div>
          )}
          {firstImageDatePromptNode}
        </div>
      </Fade>
      {shouldShowNavigation ? (
        <div className={styles.navigation}>
          <IconButton
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Entrada anterior"
          >
            <NavigateBeforeIcon />
          </IconButton>
          <IconButton
            onClick={handleNext}
            disabled={currentIndex === invalidEntries.length - 1}
            aria-label="Entrada siguiente"
          >
            <NavigateNextIcon />
          </IconButton>
        </div>
      ) : null}

      {shouldRenderImage && source ? (
        <Dialog
          open={isZoomOpen}
          onClose={closeZoom}
          maxWidth="lg"
          fullWidth
          aria-labelledby="invalid-entry-zoom-title"
        >
          <DialogContent className={styles.zoomDialogContent}>
            <div className={styles.zoomHeader}>
              <Typography id="invalid-entry-zoom-title" variant="subtitle1">
                Vista ampliada
              </Typography>
              <div className={styles.zoomControls}>
                <IconButton
                  onClick={decreaseZoom}
                  disabled={zoomLevel <= minZoomLevel}
                  aria-label="Alejar imagen"
                >
                  <ZoomOutIcon />
                </IconButton>
                <Typography variant="body2" className={styles.zoomPercent}>
                  {Math.round(zoomLevel * 100)}%
                </Typography>
                <IconButton
                  onClick={increaseZoom}
                  disabled={zoomLevel >= maxZoomLevel}
                  aria-label="Acercar imagen"
                >
                  <ZoomInIcon />
                </IconButton>
                <IconButton
                  onClick={resetZoom}
                  aria-label="Restablecer zoom"
                  disabled={zoomLevel === 1}
                >
                  <RestartAltIcon />
                </IconButton>
                <IconButton onClick={closeZoom} aria-label="Cerrar vista ampliada">
                  <CloseIcon />
                </IconButton>
              </div>
            </div>

            <div className={styles.zoomViewport}>
              <Image
                src={source}
                alt={`Vista ampliada de la entrada inválida ${currentIndex + 1} de ${invalidEntries.length}`}
                className={styles.zoomImage}
                width={1200}
                height={1200}
                style={zoomStyle}
                unoptimized
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
};