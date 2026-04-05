"use client";

import React from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import DataTable from "../components/dataTable/DataTable";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import type { MainData } from "@/types/dashboard";

interface DashboardDetailPanelProps {
  title: string;
  editedRows: MainData[];
  isPending: boolean;
  onBack: () => void;
  onSave: () => void;
  onRowsChange: (rows: MainData[]) => void;
}

export const DashboardDetailPanel: React.FC<DashboardDetailPanelProps> = React.memo(
  ({ title, editedRows, isPending, onBack, onSave, onRowsChange }) => {
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
          </Box>
          <Box className="dashboard_detail_actions">
            <Button className="dashboard_button dashboard_button--ghost" onClick={onBack}>
              <ArrowBackRoundedIcon fontSize="small" />
              Volver al catálogo
            </Button>
            <Button
              className="dashboard_button dashboard_button--solid"
              variant="contained"
              onClick={onSave}
              disabled={isPending}
            >
              <SaveRoundedIcon fontSize="small" />
              Guardar
            </Button>
          </Box>
        </Box>
        <Box className="dashboard_detail_tableWrap">
          <DataTable rows={editedRows} mode="edit" onRowsChange={onRowsChange} />
        </Box>
      </Paper>
    );
  }
);

DashboardDetailPanel.displayName = "DashboardDetailPanel";
