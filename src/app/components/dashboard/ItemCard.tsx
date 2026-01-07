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
} from "@mui/material";
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
import { set } from "date-fns";

interface ItemCardProps {
  name: string;
  description: string;
}

interface mainData {
  date: string;
  money: string;
  id: number;
}

const InputDialog: React.FC<{
  open: boolean;
  handleInputDialogClose: () => void;
}> = ({ open, handleInputDialogClose }) => {
  const [files, setFiles] = useState<FileList>();
  const [loader, setLoader] = useState<boolean>(false);
  const [successLoad, setSuccessLoad] = useState<boolean>(false);
  const [pathData, setPathData] = useState<mainData[]>([]);
  const [sources, setSources] = useState<string[]>([""]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onContentClick = () => {
    inputRef.current?.click();
  };

  const handleDialogClose = () => {
    setSuccessLoad(false);
    setPathData([]);
    setFiles(undefined);
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
    const paths = [];
    const sources = [""];
    if (files?.length) {
      setLoader(true);
      for (let i = 0; i < files?.length; ++i) {
        const file = files[i];
        const ret = await worker.recognize(file);
        const ocrText = ret.data.text;
        sources.push(URL.createObjectURL(file));
        paths.push(ocrText);
      }
      sources.shift();
      setSources(sources);
      const expectedDatesArray = parseDates(paths);
      const expectedCurrencyArray = extractCurrencyValues(paths);
      const result = combineDatesAndCurrency(
        expectedDatesArray,
        expectedCurrencyArray
      );

      if (!isCombinedDataValid(result)) {
        console.warn("Some entries are missing date or currency. Prompt user.");
        console.log(findInvalidEntries(result));
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

  console.log({successLoad});
  

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
    >
      <DialogTitle id="alert-dialog-title">Subir Archivo</DialogTitle>
      <DialogContent
        className="file_upload_container"
        onClick={onContentClick}
        style={{ cursor: "pointer" }}
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
            <CheckCircleIcon style={{ fontSize: 80, color: "#4caf50" }} />
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
