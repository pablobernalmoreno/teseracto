import { Card, CardActionArea, CardContent, Typography, Box, Checkbox } from "@mui/material";
import DataTable from "../../dataTable/DataTable";
import { MainData } from "@/modules/dashboard/model/useItemCardModel";

interface NormalItemCardProps {
  cardId: string | number;
  name: string;
  description: string;
  content?: MainData[];
  onOpenDetail?: (id: string | number) => void;
  isSelected?: boolean;
  onSelectionChange?: (checked: boolean) => void;
}

export const NormalItemCard: React.FC<NormalItemCardProps> = ({
  cardId,
  name,
  description,
  content = [],
  onOpenDetail,
  isSelected = false,
  onSelectionChange,
}) => {
  // Get first 3 entries for preview
  const previewData = content.slice(0, 3);
  return (
    <Card
      sx={{
        maxWidth: 345,
        maxHeight: 370,
        margin: "1rem",
        borderRadius: "12px",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 2,
          bgcolor: "rgba(255,255,255,0.85)",
          borderRadius: "50%",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onChange={(event) => onSelectionChange?.(event.target.checked)}
          slotProps={{ input: { "aria-label": `Select ${name}` } }}
        />
      </Box>
      <CardActionArea
        onClick={() => {
          onOpenDetail?.(cardId);
        }}
      >
        <CardContent sx={{ maxHeight: 90 }}>
          <Typography gutterBottom variant="h5" component="div">
            {name}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {description}
          </Typography>
        </CardContent>
        <Box sx={{ bgcolor: "#f9f9f9", height: 140, overflow: "hidden", px: 1 }}>
          <DataTable rows={previewData} />
        </Box>
      </CardActionArea>
    </Card>
  );
};
