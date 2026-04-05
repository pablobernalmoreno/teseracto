"use client";

import React, { useMemo } from "react";
import { Box, Paper, Typography } from "@mui/material";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import PlaylistAddCheckCircleRoundedIcon from "@mui/icons-material/PlaylistAddCheckCircleRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";

interface DashboardSummaryStatsProps {
  libraryCount: number;
  selectedCardId: string | number | null;
  editedRowsLength: number;
  filteredCount: number;
  selectedDeleteCount: number;
  totalPages: number;
}

export const DashboardSummaryStats: React.FC<DashboardSummaryStatsProps> = React.memo(
  ({
    libraryCount,
    selectedCardId,
    editedRowsLength,
    filteredCount,
    selectedDeleteCount,
    totalPages,
  }) => {
    const summaryItems = useMemo(
      () => [
        {
          label: "Archivo",
          value: libraryCount,
          icon: <AutoStoriesRoundedIcon fontSize="inherit" />,
          tone: "Tus libros listos para revisar.",
        },
        {
          label: "En vista",
          value: selectedCardId ? editedRowsLength : filteredCount,
          icon: <GridViewRoundedIcon fontSize="inherit" />,
          tone: selectedCardId ? "Filas cargadas en edición." : "Resultados disponibles ahora.",
        },
        {
          label: "Selección",
          value: selectedDeleteCount,
          icon: <PlaylistAddCheckCircleRoundedIcon fontSize="inherit" />,
          tone: "Elementos listos para acción masiva.",
        },
        {
          label: "Páginas",
          value: totalPages,
          icon: <LayersRoundedIcon fontSize="inherit" />,
          tone: "Recorrido paginado de la colección.",
        },
      ],
      [
        libraryCount,
        selectedCardId,
        editedRowsLength,
        filteredCount,
        selectedDeleteCount,
        totalPages,
      ]
    );

    return (
      <Box className="dashboard_hero_stats" aria-label="Resumen del dashboard">
        {summaryItems.map((item) => (
          <Paper key={item.label} elevation={0} className="dashboard_stat_card">
            <Box className="dashboard_stat_icon" aria-hidden="true">
              {item.icon}
            </Box>
            <Typography className="dashboard_stat_value" component="p">
              {item.value}
            </Typography>
            <Typography className="dashboard_stat_label" component="p">
              {item.label}
            </Typography>
            <Typography className="dashboard_stat_tone" variant="body2">
              {item.tone}
            </Typography>
          </Paper>
        ))}
      </Box>
    );
  }
);

DashboardSummaryStats.displayName = "DashboardSummaryStats";
