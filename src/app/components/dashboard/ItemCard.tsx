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
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import supabase from "@/config/supabaseClient";

interface ItemCardProps {
  name: string;
  description: string;
}

const InputDialog = ({ open, handleInputDialogClose }: any) => {
  return (
    <Dialog open={open} onClose={handleInputDialogClose}>
      <DialogTitle id="alert-dialog-title">
        Use Google's location service?
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Let Google help apps determine location. This means sending anonymous
          location data to Google, even when no apps are running.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleInputDialogClose}>Disagree</Button>
        <Button onClick={handleInputDialogClose} autoFocus>
          Agree
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const NewItemCard = () => {
  const [open, setOpen] = useState(false);

  const handleInputDialogOpen = () => {
    setOpen(true);
  }
  const handleInputDialogClose = () => {
    setOpen(false);
  }

  const InputDialogProps = {
    open,
    handleInputDialogClose,
  }
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
      <InputDialog {...InputDialogProps}/>
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
