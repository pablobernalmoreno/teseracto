"use client";
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
import React, { useState, useRef, useEffect } from "react";
import { createWorker } from "tesseract.js";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import "./dashboardStyles.css";
import {
  combineDatesAndCurrency,
  extractCurrencyValues,
  findInvalidEntries,
  isCombinedDataValid,
  parseDates,
} from "@/app/utils/data";
import Image from "next/image";

interface ItemCardProps {
  name: string;
  description: string;
}

interface mainData {
  date: string;
  money: string;
  id: number;
}

interface InvalidEntry {
  index: number;
  id: number;
  date?: string;
  money?: string;
}

const InvalidEntryCarousel: React.FC<{
  invalidEntries: any[];
  sources: string[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onDateChange: (value: string) => void;
  onMoneyChange: (value: string) => void;
}> = ({
  invalidEntries,
  sources,
  currentIndex,
  onPrev,
  onNext,
  onDateChange,
  onMoneyChange,
}) => {
  if (!invalidEntries.length) return null;
  const entry = invalidEntries[currentIndex];
  const source = sources[entry?.id];

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
      {source && (
        <Image src={source} alt="Invalid Entry" width={150} height={150} />
      )}
      <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
        <TextField
          label="Fecha"
          type="date"
          variant="outlined"
          size="small"
          defaultValue={entry?.date || ""}
          onChange={(e) => onDateChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Dinero"
          type="number"
          variant="outlined"
          size="small"
          defaultValue={entry?.money || ""}
          onChange={(e) => onMoneyChange(e.target.value)}
          sx={{ flex: 1 }}
        />
      </Box>
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

const InputDialog: React.FC<{
  open: boolean;
  handleInputDialogClose: () => void;
}> = ({ open, handleInputDialogClose }) => {
  const [files, setFiles] = useState<FileList>();
  const [loader, setLoader] = useState<boolean>(false);
  const [successLoad, setSuccessLoad] = useState<boolean>(false);
  const [pathData, setPathData] = useState<mainData[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [invalidEntries, setInvalidEntries] = useState<any[]>([]);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [editedValues, setEditedValues] = useState<Map<number, { date: string; money: string }>>(new Map());
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onContentClick = () => {
    inputRef.current?.click();
  };

  const handleDialogClose = () => {
    setSuccessLoad(false);
    setPathData([]);
    setFiles(undefined);
    setCarouselIndex(0);
    setEditedValues(new Map());
    handleInputDialogClose();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const file = target.files as FileList;
    if (file) {
      setFiles(file);
    }
  };

  const getImageText = async () => {
    const worker = await createWorker("eng");
    const paths: string[] = [];
    const newSources: string[] = [];
    if (files?.length) {
      setLoader(true);
      for (let i = 0; i < files?.length; ++i) {
        const file = files[i];
        const ret = await worker.recognize(file);
        const ocrText = ret.data.text;
        newSources.push(URL.createObjectURL(file));
        paths.push(ocrText);
      }
      setSources(newSources);
      const expectedDatesArray = parseDates(paths);
      const expectedCurrencyArray = extractCurrencyValues(paths);
      const result = combineDatesAndCurrency(
        expectedDatesArray,
        expectedCurrencyArray
      );

      if (!isCombinedDataValid(result)) {
        setInvalidEntries(findInvalidEntries(result));
      }

      setPathData(result);
    }
    await worker.terminate();
    setLoader(false);
    setSuccessLoad(true);
  };

  useEffect(() => {
    if (files?.length && files?.length !== 0) {
      getImageText();
    }
  }, [files]);

  return (
    <Dialog open={open} onClose={handleDialogClose}>
      <DialogTitle id="alert-dialog-title">Subir Archivo</DialogTitle>
      <DialogContent
        className="file_upload_container"
        onClick={onContentClick}
        style={{ cursor: successLoad ? "default" : "pointer" }}
      >
        <Fade in={loader} timeout={500}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              position: "absolute",
            }}
          >
            <CircularProgress />
          </Box>
        </Fade>
        <Fade in={successLoad} timeout={500}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              position: "absolute",
            }}
          >
            {invalidEntries.length ? (
              <InvalidEntryCarousel
                invalidEntries={invalidEntries}
                sources={sources}
                currentIndex={carouselIndex}
                onPrev={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
                onNext={() => setCarouselIndex(Math.min(invalidEntries.length - 1, carouselIndex + 1))}
                onDateChange={(value) => {
                  const newEdited = new Map(editedValues);
                  const entry = invalidEntries[carouselIndex];
                  newEdited.set(carouselIndex, {
                    date: value,
                    money: newEdited.get(carouselIndex)?.money || "",
                  });
                  setEditedValues(newEdited);
                }}
                onMoneyChange={(value) => {
                  const newEdited = new Map(editedValues);
                  const entry = invalidEntries[carouselIndex];
                  newEdited.set(carouselIndex, {
                    date: newEdited.get(carouselIndex)?.date || "",
                    money: value,
                  });
                  setEditedValues(newEdited);
                }}
              />
            ) : (
              <CheckCircleIcon style={{ fontSize: 80, color: "#4caf50" }} />
            )}
          </Box>
        </Fade>
        <Fade in={!loader && !successLoad} timeout={500}>
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
        </Fade>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose}>Cancelar</Button>
        <Button onClick={handleDialogClose} autoFocus>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const NewItemCard = () => {
  const [open, setOpen] = useState(false);

  const handleInputDialogOpen = () => {
    setOpen(true);
  };
  const handleInputDialogClose = () => {
    setOpen(false);
  };

  const InputDialogProps = {
    open,
    handleInputDialogClose,
  };
  return (
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
      <CardActionArea
        onClick={() => {
          handleInputDialogOpen();
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <AddIcon sx={{ fontSize: 50 }} />
        </CardContent>
      </CardActionArea>
      <InputDialog {...InputDialogProps} />
    </Card>
  );
};

const NormalItemCard = ({ name, description }: ItemCardProps) => {
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

export const ItemCard = ({ name, description }: ItemCardProps) => {
  return (
    <>
      {name.includes("newItemCard") ? (
        <NewItemCard />
      ) : (
        <NormalItemCard name={name} description={description} />
      )}
    </>
  );
};
