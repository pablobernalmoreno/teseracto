import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
} from "@mui/material";
import React from "react";
import AddIcon from "@mui/icons-material/Add";
import supabase from "@/config/supabaseClient";

interface ItemCardProps {
  name: string;
  description: string;
}

const getBookData = async () => {
  const { data: userData, error: userDataError } = await supabase
    .from("user_profile")
    .select();
  const { data: bookData, error: bookDataError } = await supabase
    .from("user_books")
    .select();

  console.log({ userData, bookData });
};

const NewItemCard = () => {
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
          getBookData();
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
