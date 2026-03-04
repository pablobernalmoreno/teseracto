import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { MainData } from "@/modules/dashboard/model/useItemCardModel";

interface NormalItemCardProps {
  cardId: string | number;
  name: string;
  description: string;
  content?: MainData[];
  onOpenDetail?: (id: string | number) => void;
}

export const NormalItemCard: React.FC<NormalItemCardProps> = ({
  cardId,
  name,
  description,
  content = [],
  onOpenDetail,
}) => {
  // Get first 3 entries for preview
  const previewData = content.slice(0, 3);

  // Format date from various formats to dd/mm/yyyy
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "--/--/----";
    // Handle dd/mm/yyyy format (already correct)
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    // Handle yyyy-mm-dd format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };
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
        <Box sx={{ bgcolor: "#f9f9f9", height: 140, overflow: "hidden" }}>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ bgcolor: "transparent" }}
          >
            <Table size="small" sx={{ minWidth: 200 }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ fontWeight: "bold", fontSize: "0.7rem", py: 0.5 }}
                  >
                    Fecha
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: "bold", fontSize: "0.7rem", py: 0.5 }}
                  >
                    Ganancias
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.length > 0 ? (
                  previewData.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell sx={{ fontSize: "0.7rem", py: 0.5 }}>
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontSize: "0.7rem", py: 0.5 }}
                      >
                        {entry.money}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      align="center"
                      sx={{
                        fontSize: "0.7rem",
                        py: 1,
                        color: "text.secondary",
                      }}
                    >
                      Sin datos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </CardActionArea>
    </Card>
  );
};
