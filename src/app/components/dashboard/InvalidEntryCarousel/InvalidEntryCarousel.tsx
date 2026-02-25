import { MainData } from "@/modules/dashboard/model/useItemCardModel";
import { Box, Fade, IconButton, TextField, Typography } from "@mui/material";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import Image from "next/image";

export interface CarouselValues {
  [entryId: number]: {
    date: string;
    money: string;
  };
}

interface InvalidEntryCarouselProps {
  invalidEntries: MainData[];
  sources: string[];
  currentIndex: number;
  carouselValues: CarouselValues;
  onPrev: () => void;
  onNext: () => void;
  onDateChange: (entryId: number, value: string) => void;
  onMoneyChange: (entryId: number, value: string) => void;
}

export const InvalidEntryCarousel: React.FC<InvalidEntryCarouselProps> = ({
  invalidEntries,
  sources,
  currentIndex,
  carouselValues,
  onPrev,
  onNext,
  onDateChange,
  onMoneyChange,
}) => {
  if (!invalidEntries.length) return null;
  const entry = invalidEntries[currentIndex];
  const source = sources[entry?.id];
  const currentValues = carouselValues[entry.id] || { date: "", money: "" };

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
            <Image src={source} alt="Invalid Entry" width={150} height={150} />
          )}
          <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
            <TextField
              key={`date-${currentIndex}`}
              label="Fecha"
              type="date"
              variant="outlined"
              size="small"
              value={currentValues.date}
              onChange={(e) => onDateChange(entry.id, e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <TextField
              key={`money-${currentIndex}`}
              label="Dinero"
              type="number"
              variant="outlined"
              size="small"
              value={currentValues.money}
              onChange={(e) => onMoneyChange(entry.id, e.target.value)}
              sx={{ flex: 1 }}
            />
          </Box>
        </Box>
      </Fade>
      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
        <IconButton onClick={onPrev} disabled={currentIndex === 0}>
          <NavigateBeforeIcon />
        </IconButton>
        <IconButton
          onClick={onNext}
          disabled={currentIndex === invalidEntries.length - 1}
        >
          <NavigateNextIcon />
        </IconButton>
      </Box>
    </Box>
  );
};
