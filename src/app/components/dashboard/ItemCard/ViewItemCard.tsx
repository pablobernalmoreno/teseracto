"use client";

import { Card, CardActionArea, CardContent, Typography, Box, Checkbox } from "@mui/material";
import type { MainData } from "@/types/dashboard";
import DataTable from "../../dataTable/DataTable";

interface ViewItemCardProps {
  cardId: string | number;
  name: string;
  content?: MainData[];
  onOpenDetail?: (id: string | number) => void;
  isSelected?: boolean;
  onSelectionChange?: (checked: boolean) => void;
}

export const ViewItemCard: React.FC<ViewItemCardProps> = ({
  cardId,
  name,
  content = [],
  onOpenDetail,
  isSelected = false,
  onSelectionChange,
}) => {
  const previewData = content.slice(0, 3);

  return (
    <Card
      className="dashboard-card-root"
      sx={{
        maxWidth: "100%",
        minHeight: 370,
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
          slotProps={{ input: { "aria-label": `Seleccionar ${name}` } }}
        />
      </Box>
      <CardActionArea
        sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
        aria-label={`Abrir detalle de ${name}`}
        onClick={() => {
          onOpenDetail?.(cardId);
        }}
      >
        <CardContent
          sx={{
            width: "100%",
            maxHeight: 120,
            px: 2.2,
            pt: 2.3,
            pb: 1.2,
          }}
        >
          <Typography
            gutterBottom
            variant="h5"
            component="div"
            sx={{ fontFamily: "var(--font-geist-sans), Segoe UI, sans-serif", lineHeight: 0.95 }}
          >
            {name}
          </Typography>
          <Typography variant="body2" sx={{ color: "#60706a", lineHeight: 1.6 }}>
            Ajusta fechas y ganancias con una vista limpia pensada para revisión rápida.
          </Typography>
        </CardContent>
        <Box
          sx={{
            bgcolor: "rgba(255,255,255,0.52)",
            height: 172,
            overflow: "hidden",
            px: 1.1,
            pb: 1,
            width: "100%",
          }}
        >
          <DataTable rows={previewData} mode="view" />
        </Box>
      </CardActionArea>
    </Card>
  );
};
