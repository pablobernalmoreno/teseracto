import { Card, CardActionArea, CardContent, CardMedia, Typography } from "@mui/material";

interface NormalItemCardProps {
  cardId: string | number;
  name: string;
  description: string;
}

export const NormalItemCard: React.FC<NormalItemCardProps> = ({
  cardId,
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
      <CardActionArea
        onClick={() => console.log(`Clicked on ${name} with id ${cardId}`)}
      >
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
