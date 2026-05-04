"use client";

import React, { useState } from "react";
import { Box, Button, CircularProgress, Paper, TextField, Typography } from "@mui/material";
import DataTable from "@/app/components/dataTable/DataTable";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import type { MainData } from "@/types/dashboard";
import { exportBookToPdf } from "@/app/utils/exportPdf";

interface DashboardDetailPanelProps {
  bookId: string | number;
  title: string;
  bookDate?: string;
  hasUnsavedChanges: boolean;
  editedRows: MainData[];
  isPending: boolean;
  onBack: () => void;
  onSave: () => void;
  onSaveAndExit: () => void;
  onBookDateChange: (date: string) => void;
  onRowsChange: (rows: MainData[]) => void;
}

export const DashboardDetailPanel: React.FC<DashboardDetailPanelProps> = React.memo(
  ({
    bookId,
    title,
    bookDate,
    hasUnsavedChanges,
    editedRows,
    isPending,
    onBack,
    onSave,
    onSaveAndExit,
    onBookDateChange,
    onRowsChange,
  }) => {
    const saveLabel = hasUnsavedChanges ? "Guardar *" : "Guardar";
    const saveAndExitLabel = hasUnsavedChanges ? "Guardar y salir *" : "Guardar y salir";

    const [exporting, setExporting] = useState(false);
    const handleExportPdf = async () => {
      if (exporting) return;
      setExporting(true);
      try {
        await exportBookToPdf({ bookId, bookTitle: title, rows: editedRows });
      } catch {
        // silently fail
      } finally {
        setExporting(false);
      }
    };

    return (
      <Paper elevation={0} className="dashboard_detail_panel">
        <Box className="dashboard_detail_header">
          <Box className="dashboard_detail_intro">
            <Typography className="dashboard_detail_eyebrow" component="p">
              Cuaderno de edición
            </Typography>
            <Typography className="dashboard_detail_title" component="h2" variant="h4">
              {title}
            </Typography>
            <Typography className="dashboard_detail_description" variant="body1">
              {"Ajusta fechas y ganancias con una vista limpia pensada para revisión rápida."}
            </Typography>
            <TextField
              className="dashboard_detail_date_input"
              label="Fecha del libro"
              type="date"
              size="small"
              value={bookDate || ""}
              onChange={(event) => onBookDateChange(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
          <Box className="dashboard_detail_actions">
            <Button className="dashboard_button dashboard_button--ghost" onClick={onBack}>
              <ArrowBackRoundedIcon fontSize="small" />
              Volver al catálogo
            </Button>
            <Button
              className="dashboard_button dashboard_button--ghost"
              onClick={handleExportPdf}
              disabled={exporting || isPending}
            >
              {exporting ? (
                <CircularProgress size={14} sx={{ color: "inherit" }} />
              ) : (
                <PictureAsPdfOutlinedIcon fontSize="small" />
              )}
              {exporting ? "Exportando…" : "Exportar a PDF"}
            </Button>
            <Button
              className="dashboard_button dashboard_button--soft"
              variant="contained"
              onClick={onSave}
              disabled={isPending}
            >
              <SaveRoundedIcon fontSize="small" />
              {saveLabel}
            </Button>
            <Button
              className="dashboard_button dashboard_button--solid"
              variant="contained"
              onClick={onSaveAndExit}
              disabled={isPending}
            >
              <SaveRoundedIcon fontSize="small" />
              {saveAndExitLabel}
            </Button>
          </Box>
        </Box>
        <Box className="dashboard_detail_tableWrap">
          <DataTable
            rows={editedRows}
            mode="edit"
            fixedDate={bookDate}
            onRowsChange={onRowsChange}
          />
        </Box>
      </Paper>
    );
  }
);

DashboardDetailPanel.displayName = "DashboardDetailPanel";
