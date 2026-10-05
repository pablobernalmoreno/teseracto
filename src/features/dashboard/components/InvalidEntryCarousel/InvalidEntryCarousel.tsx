"use client";

import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { MainData } from "@/types/dashboard";
import {
  Button,
  Dialog,
  DialogContent,
  Fade,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CloseIcon from "@mui/icons-material/Close";
import Image from "next/image";
import { displayToIso } from "@/lib/receipts/dates";
import { describeEntryIssues, type EntryIssues } from "@/features/dashboard/model/reviewEntries";
import styles from "./InvalidEntryCarousel.module.css";

interface InvalidEntryCarouselProps {
  // The entries to review, with their current date and amount.
  entries: MainData[];
  sources: string[];
  currentIndex: number;
  entryIssues: Record<number, EntryIssues>;
  // Title the book will get from the dates as they stand now.
  rangeTitle: string;
  // `value` is the `yyyy-MM-dd` value of the date input.
  onDateChange: (entryId: number, value: string) => void;
  onMoneyChange: (entryId: number, value: string) => void;
  onConfirmDate: (entryId: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

const NO_ISSUES: EntryIssues = { missingDate: false, missingAmount: false, dateOutlier: false };

export const InvalidEntryCarousel: React.FC<InvalidEntryCarouselProps> = ({
  entries,
  sources,
  currentIndex,
  entryIssues,
  rangeTitle,
  onDateChange,
  onMoneyChange,
  onConfirmDate,
  onPrev,
  onNext,
}) => {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const panStart = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  const minZoomLevel = 1;
  const maxZoomLevel = 4;
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

  // Dragging the zoomed image scrolls it; the scrollbars and the wheel keep working as well.
  const startPan = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    panStart.current = {
      x: event.clientX,
      y: event.clientY,
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
    };
    viewport.setPointerCapture?.(event.pointerId);
    setIsPanning(true);
  };

  const movePan = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    const start = panStart.current;
    if (!viewport || !start) return;
    viewport.scrollLeft = start.left - (event.clientX - start.x);
    viewport.scrollTop = start.top - (event.clientY - start.y);
  };

  const endPan = () => {
    panStart.current = null;
    setIsPanning(false);
  };

  const handlePrev = () => {
    closeZoom();
    onPrev();
  };

  const handleNext = () => {
    closeZoom();
    onNext();
  };

  const entry = entries[currentIndex];
  if (!entries.length || !entry) return null;

  const source = sources[entry.id];
  const issues = entryIssues[entry.id] ?? NO_ISSUES;
  const message = describeEntryIssues(issues);
  const shouldShowNavigation = entries.length > 1;
  const zoomStyle = { "--zoom-width": `${zoomLevel * 100}%` } as CSSProperties;

  return (
    <div className={styles.root}>
      <Typography variant="h6">
        Entrada {currentIndex + 1} de {entries.length}
      </Typography>
      <Typography variant="body2" color="text.secondary" className={styles.selectedDate}>
        {rangeTitle ? `El libro se guardará como: ${rangeTitle}` : "El libro aún no tiene fecha"}
      </Typography>
      <Fade in={true} timeout={500}>
        <div className={styles.content}>
          {source ? (
            <button
              type="button"
              onClick={openZoom}
              aria-label="Abrir vista ampliada de la imagen"
              className={styles.previewButton}
            >
              <Image
                src={source}
                alt={`Vista previa de la entrada ${currentIndex + 1} de ${entries.length}`}
                width={180}
                height={180}
              />
            </button>
          ) : null}
          {message ? (
            <Typography sx={{ color: "warning.main" }} className={styles.messageText}>
              {message}
            </Typography>
          ) : null}
          <div className={styles.moneyRow}>
            <TextField
              key={`date-${entry.id}`}
              label="Fecha"
              type="date"
              variant="outlined"
              size="small"
              value={displayToIso(entry.date)}
              onChange={(e) => onDateChange(entry.id, e.target.value)}
              error={issues.missingDate || issues.dateOutlier}
              className={styles.moneyField}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              key={`money-${entry.id}`}
              label="Valor"
              type="text"
              variant="outlined"
              size="small"
              value={entry.money === "N/A" ? "" : entry.money}
              onChange={(e) => onMoneyChange(entry.id, e.target.value)}
              error={issues.missingAmount}
              className={styles.moneyField}
            />
          </div>
          {issues.dateOutlier ? (
            <Button variant="outlined" size="small" onClick={() => onConfirmDate(entry.id)}>
              Confirmar fecha
            </Button>
          ) : null}
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
            disabled={currentIndex === entries.length - 1}
            aria-label="Entrada siguiente"
          >
            <NavigateNextIcon />
          </IconButton>
        </div>
      ) : null}

      {source ? (
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

            <div
              ref={viewportRef}
              className={`${styles.zoomViewport} ${isPanning ? styles.zoomViewportDragging : ""}`}
              data-testid="zoom-viewport"
              onPointerDown={startPan}
              onPointerMove={movePan}
              onPointerUp={endPan}
              onPointerCancel={endPan}
            >
              <Image
                src={source}
                alt={`Vista ampliada de la entrada ${currentIndex + 1} de ${entries.length}`}
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
