import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
} from "@mui/material";
import React from "react";

interface ItemCardProps {
  name: string;
  description: string;
}

export const ItemCard = ({ name, description }: ItemCardProps) => {
  return (
    <Card sx={{ maxWidth: 345, margin: "1rem", borderRadius: "12px" }}>
      <CardActionArea>
        <CardContent>
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
