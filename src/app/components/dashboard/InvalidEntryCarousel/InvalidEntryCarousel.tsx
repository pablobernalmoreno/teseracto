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
  entryMessage,
  onPrev,
  onNext,
  onMoneyChange,
}) => {
  if (!invalidEntries.length) return null;
  const entry = invalidEntries[currentIndex];
  const source = sources[entry?.id];
  const currentValues = carouselValues[entry.id] || { money: "" };

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
      <Typography variant="h6">
        Entrada {currentIndex + 1} de {invalidEntries.length}
      </Typography>
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
          {source && (
            <Image
              src={source}
              alt={`Vista previa de la entrada inválida ${currentIndex + 1} de ${invalidEntries.length}`}
              width={150}
              height={150}
            />
          )}
          {entryMessage ? (
            <Typography color={isEntryExcluded ? "error" : "warning.main"} textAlign="center">
              {entryMessage}
            </Typography>
          ) : null}
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
              sx={{ flex: 1 }}
            />
          </Box>
        </Box>
      </Fade>
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
    </Box>
  );
};
