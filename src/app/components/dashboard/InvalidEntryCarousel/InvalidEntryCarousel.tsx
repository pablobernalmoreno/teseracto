"use client";

import type { MainData } from "@/types/dashboard";
import { Box, Fade, IconButton, TextField, Typography } from "@mui/material";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import Image from "next/image";

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
  onPrev: () => void;
  onNext: () => void;
  onMoneyChange: (entryId: number, value: string) => void;
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
  onPrev,
  onNext,
  onMoneyChange,
}) => {
  if (!invalidEntries.length) return null;
  const entry = invalidEntries[currentIndex];
  const source = sources[entry?.id];
  const currentValues = carouselValues[entry.id] || { money: "" };
  const shouldRenderImage = Boolean(source) && !isDateMismatch;
  const shouldShowNavigation = invalidEntries.length > 1;

  let messageNode: React.ReactNode = null;
  if (isDateMismatch) {
    messageNode = (
      <Typography color="error" sx={{ textAlign: "center" }}>
        {dateMismatchCount} imagenes no correspondian con la fecha elegida:{" "}
        {selectedDate || "No detectada"}, por lo que no seran agregadas.
      </Typography>
    );
  } else if (entryMessage) {
    messageNode = (
      <Typography color={isEntryExcluded ? "error" : "warning.main"} sx={{ textAlign: "center" }}>
        {entryMessage}
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        width: "100%",
      }}
    >
      {isDateMismatch ? null : (
        <Typography variant="h6">
          Entrada {currentIndex + 1} de {invalidEntries.length}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary">
        Fecha seleccionada: {selectedDate || "No detectada"}
      </Typography>
      <Fade in={true} timeout={500}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
            alignItems: "center",
          }}
        >
          {shouldRenderImage ? (
            <Image
              src={source}
              alt={`Vista previa de la entrada invalida ${currentIndex + 1} de ${invalidEntries.length}`}
              width={150}
              height={150}
            />
          ) : null}
          {messageNode}
          {isDateMismatch ? null : (
            <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
              <TextField
                key={`money-${currentIndex}`}
                label="Dinero"
                type="text"
                variant="outlined"
                size="small"
                value={currentValues.money}
                onChange={(e) => onMoneyChange(entry.id, e.target.value)}
                disabled={isEntryExcluded}
                sx={{
                  flex: 1,
                  "& .MuiInputBase-root": {
                    color: "var(--color-text-primary)",
                    backgroundColor: "var(--color-surface-muted)",
                  },
                  "& .MuiInputLabel-root": {
                    color: "var(--color-text-secondary)",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "var(--color-accent)",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(var(--rgb-border), 0.42)",
                  },
                  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(var(--rgb-accent-strong), 0.7)",
                  },
                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--color-accent)",
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </Fade>
      {shouldShowNavigation ? (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <IconButton onClick={onPrev} disabled={currentIndex === 0} aria-label="Entrada anterior">
            <NavigateBeforeIcon />
          </IconButton>
          <IconButton
            onClick={onNext}
            disabled={currentIndex === invalidEntries.length - 1}
            aria-label="Entrada siguiente"
          >
            <NavigateNextIcon />
          </IconButton>
        </Box>
      ) : null}
    </Box>
  );
};
