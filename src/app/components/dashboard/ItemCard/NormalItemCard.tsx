"use client";

import { Card, CardActionArea, CardContent, Typography, Box, Checkbox } from "@mui/material";
import DataTable from "../../dataTable/DataTable";
import styles from "./NormalItemCard.module.css";
import type { MainData } from "@/types/dashboard";

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
  const previewData = content.slice(0, 3);
  return (
    <Card className={`dashboard-card-root ${styles.cardRoot}`}>
      <Box className={styles.checkboxContainer} onClick={(event) => event.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onChange={(event) => onSelectionChange?.(event.target.checked)}
          slotProps={{ input: { "aria-label": `Seleccionar ${name}` } }}
        />
      </Box>
      <CardActionArea
        className={styles.cardActionArea}
        aria-label={`Abrir detalle de ${name}`}
        onClick={() => {
          onOpenDetail?.(cardId);
        }}
      >
        <CardContent className={styles.cardContent}>
          <Typography gutterBottom variant="h5" component="div" className={styles.cardTitle}>
            {name}
          </Typography>
          <Typography variant="body2" className={styles.cardDescription}>
            {description}
          </Typography>
        </CardContent>
        <Box className={styles.cardPreview}>
          <DataTable rows={previewData} mode="view" />
        </Box>
      </CardActionArea>
    </Card>
  );
};
