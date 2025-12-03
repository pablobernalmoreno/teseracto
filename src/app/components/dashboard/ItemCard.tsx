"use client";
import {
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import React, { useState, useRef } from "react";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import "./dashboardStyles.css";

interface ItemCardProps {
  name: string;
  description: string;
}

const InputDialog: React.FC<{ open: boolean; handleInputDialogClose: () => void }> = ({
  open,
  handleInputDialogClose,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onContentClick = () => {
    inputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // TODO: handle selected files (upload, preview, etc.)
      console.log('Selected files:', files);
    }
  };

  return (
    <Dialog open={open} onClose={handleInputDialogClose}>
      <DialogTitle id="alert-dialog-title">Subir Archivo</DialogTitle>
      <DialogContent
        className="file_upload_container"
        onClick={onContentClick}
        style={{ cursor: "pointer" }}
      >
        <input
          ref={inputRef}
          type="file"
          className="file_upload_hidden_input"
          onChange={onFileChange}
        />
        <Button role={undefined} variant="text" tabIndex={-1} startIcon={<CloudUploadIcon />}>
          Subir Archivos
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleInputDialogClose}>Cancelar</Button>
        <Button onClick={handleInputDialogClose} autoFocus>
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
          console.log("Add new item clicked");
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
