import React from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  Typography,
  TextField,
  IconButton,
} from "@mui/material";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Image from "next/image";
import "@/app/components/dashboard/dashboardStyles.css";

interface MainData {
  date: string;
  money: string;
  id: number;
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

interface CarouselValues {
  [entryId: number]: {
    date: string;
    money: string;
  };
}

interface InputDialogViewProps {
  open: boolean;
  loader: boolean;
  successLoad: boolean;
  invalidEntries: MainData[];
  sources: string[];
  carouselIndex: number;
  carouselValues: CarouselValues;
  onClose: () => void;
  onSave: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrev: () => void;
  onNext: () => void;
  onDateChange: (entryId: number, value: string) => void;
  onMoneyChange: (entryId: number, value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onContentClick: () => void;
}

export const InputDialogView: React.FC<InputDialogViewProps> = ({
  open,
  loader,
  successLoad,
  invalidEntries,
  sources,
  carouselIndex,
  carouselValues,
  onClose,
  onSave,
  onFileChange,
  onPrev,
  onNext,
  onDateChange,
  onMoneyChange,
  inputRef,
  onContentClick,
}) => {
  const currentEntry = invalidEntries[carouselIndex];
  const currentValues = currentEntry ? carouselValues[currentEntry.id] || { date: "", money: "" } : { date: "", money: "" };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle id="alert-dialog-title">Subir Archivo</DialogTitle>
      <DialogContent
        className="file_upload_container"
        onClick={!loader && !successLoad ? onContentClick : undefined}
        style={{ cursor: !loader && !successLoad ? "pointer" : "default" }}
        sx={{ overflow: "visible" }}
      >
        {loader ? (
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
        ) : successLoad ? (
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
            {invalidEntries.length ? (
              <InvalidEntryCarousel
                invalidEntries={invalidEntries}
                sources={sources}
                currentIndex={carouselIndex}
                carouselValues={carouselValues}
                onPrev={onPrev}
                onNext={onNext}
                onDateChange={onDateChange}
                onMoneyChange={onMoneyChange}
              />
            ) : (
              <Fade in={true} timeout={500}>
                <CheckCircleIcon style={{ fontSize: 80, color: "#4caf50" }} />
              </Fade>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="file_upload_hidden_input"
              onChange={onFileChange}
            />
            <Button
              role={undefined}
              variant="text"
              tabIndex={-1}
              startIcon={<CloudUploadIcon />}
            >
              Subir Archivos
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button 
          onClick={onSave} 
          autoFocus
          disabled={invalidEntries.length > 0 && (!currentValues.date || !currentValues.money)}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface NormalItemCardViewProps {
  name: string;
  description: string;
}

export const NormalItemCardView: React.FC<NormalItemCardViewProps> = ({
  name,
  description,
}) => {
  return (
    <Card
      sx={{
        maxWidth: 345,
        maxHeight: 370,
        margin: "1rem",
        borderRadius: "12px",
      }}
    >
      <CardActionArea>
        <CardContent sx={{ maxHeight: 90 }}>
          <Typography gutterBottom variant="h5" component="div">
            {name}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {description}
          </Typography>
        </CardContent>
        <CardMedia
          component="img"
          height="140"
          image="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Mustela_nivalis_-British_Wildlife_Centre-4.jpg/1024px-Mustela_nivalis_-British_Wildlife_Centre-4.jpg"
          alt="green iguana"
        />
      </CardActionArea>
    </Card>
  );
};

interface NewItemCardViewProps {
  onAddClick: () => void;
  dialogProps: Omit<InputDialogViewProps, "carouselValues" | "onDateChange" | "onMoneyChange"> & {
    carouselValues: CarouselValues;
    onDateChange: (entryId: number, value: string) => void;
    onMoneyChange: (entryId: number, value: string) => void;
  };
}

export const NewItemCardView: React.FC<NewItemCardViewProps> = ({
  onAddClick,
  dialogProps,
}) => {
  return (
    <>
      <Card
        sx={{
          margin: "1rem",
          borderRadius: "12px",
          width: 200,
          height: 200,
          display: "flex",
          alignItems: "center",
        }}
      >
        <CardActionArea onClick={onAddClick}>
          <CardContent
            sx={{
              display: "flex",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="50"
              height="50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </CardContent>
        </CardActionArea>
      </Card>
      <InputDialogView {...dialogProps} />
    </>
  );
};
