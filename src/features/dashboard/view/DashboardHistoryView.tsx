"use client";

import React, { useMemo, useState } from "react";
import { Box, Button, Typography, Paper, ToggleButton, ToggleButtonGroup } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { format, parseISO, parse, isValid, startOfDay, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { type BookData } from "@/app/actions/dashboard";

interface DashboardHistoryViewProps {
  books: BookData[];
  isLoading?: boolean;
  loadError?: string | null;
  onBack: () => void;
}

type HistoryFilter = "all" | "month" | "week";

interface ChartDataPoint {
  date: string;
  isoDate: string;
  total: number;
}

function parseEntryDate(rawDate?: string): Date | null {
  if (!rawDate) {
    return null;
  }

  const value = rawDate.trim();
  if (!value) {
    return null;
  }

  const isoDate = parseISO(value);
  if (isValid(isoDate)) {
    return isoDate;
  }

  const supportedFormats = ["dd/MM/yyyy", "d/M/yyyy", "yyyy/MM/dd", "dd-MM-yyyy", "d-M-yyyy"];
  for (const dateFormat of supportedFormats) {
    const parsed = parse(value, dateFormat, new Date());
    if (isValid(parsed)) {
      return parsed;
    }
  }

  return null;
}

function parseMoneyToNumber(value: string | undefined): number {
  const str = String(value ?? "").trim();
  if (!str) return 0;
  const cleaned = str.replaceAll(/[^0-9.,-]/g, "");
  if (!cleaned) return 0;
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  if (lastComma === -1 && lastDot === -1) return Number(cleaned) || 0;
  if (lastComma > -1 && lastDot === -1) {
    const decimalsLen = cleaned.length - lastComma - 1;
    if (decimalsLen === 3) return Number(cleaned.replaceAll(",", "")) || 0;
    return Number(cleaned.replaceAll(",", ".")) || 0;
  }
  if (lastDot > -1 && lastComma === -1) {
    const decimalsLen = cleaned.length - lastDot - 1;
    if (decimalsLen === 3) return Number(cleaned.replaceAll(".", "")) || 0;
    return Number(cleaned) || 0;
  }
  if (lastComma > lastDot) {
    return Number(cleaned.replaceAll(".", "").replace(",", ".")) || 0;
  }
  return Number(cleaned.replaceAll(",", "")) || 0;
}

function processBookEntry(dateMap: Map<string, number>, entry: { date?: string; money?: string }) {
  if (!entry.date) return;
  const parsed = parseEntryDate(entry.date);
  if (!parsed || !isValid(parsed)) return;
  const key = format(parsed, "yyyy-MM-dd");
  const val = parseMoneyToNumber(entry.money);
  dateMap.set(key, (dateMap.get(key) ?? 0) + val);
}

function buildDateMap(books: BookData[]): Map<string, number> {
  const dateMap = new Map<string, number>();
  for (const book of books) {
    if (!Array.isArray(book.content)) continue;
    for (const entry of book.content) {
      processBookEntry(dateMap, entry);
    }
  }
  return dateMap;
}

export const DashboardHistoryView: React.FC<DashboardHistoryViewProps> = ({
  books,
  isLoading = false,
  loadError = null,
  onBack,
}) => {
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");

  const chartData = useMemo(() => {
    const dateMap = buildDateMap(books);

    const sorted = Array.from(dateMap.entries()).sort(([a], [b]) => a.localeCompare(b));

    return sorted.map(
      ([date, total]): ChartDataPoint => ({
        isoDate: date,
        date: format(parseISO(date), "dd MMM yy", { locale: es }),
        total,
      })
    );
  }, [books]);

  const filteredChartData = useMemo(() => {
    if (historyFilter === "all") {
      return chartData;
    }

    const today = startOfDay(new Date());
    const cutoff = historyFilter === "week" ? subDays(today, 6) : subDays(today, 29);

    return chartData.filter((point) => {
      const pointDate = parseISO(point.isoDate);
      return isValid(pointDate) && pointDate >= cutoff;
    });
  }, [chartData, historyFilter]);

  const handleFilterChange = (_: React.MouseEvent<HTMLElement>, value: HistoryFilter | null) => {
    if (!value) return;
    setHistoryFilter(value);
  };

  const isEmpty = filteredChartData.length === 0;

  let chartContent: React.ReactNode;
  if (isLoading) {
    chartContent = (
      <Box className="dashboard_history_empty">
        <Typography variant="body1" color="text.secondary">
          Cargando historial de todos los libros...
        </Typography>
      </Box>
    );
  } else if (loadError) {
    chartContent = (
      <Box className="dashboard_history_empty">
        <Typography variant="body1" color="error">
          {loadError}
        </Typography>
      </Box>
    );
  } else if (isEmpty) {
    chartContent = (
      <Box className="dashboard_history_empty">
        <Typography variant="body1" color="text.secondary">
          No hay entradas con fechas para graficar en este filtro.
        </Typography>
      </Box>
    );
  } else {
    chartContent = (
      <ResponsiveContainer width="100%" height={420}>
        <LineChart data={filteredChartData} margin={{ top: 16, right: 32, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="total"
            name="Total de todos los libros"
            stroke="#216f2e"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <Box className="dashboard_history_view">
      <Box className="dashboard_history_header">
        <Box className="dashboard_history_heading">
          <Button
            className="appbar_buttons"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            aria-label="Volver a las tablas"
          >
            Volver
          </Button>
          <Typography variant="h5" component="h2" className="dashboard_history_title">
            Historial general de libros
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={historyFilter}
          exclusive
          onChange={handleFilterChange}
          size="small"
          className="dashboard_history_filters"
          aria-label="Filtrar historial"
        >
          <ToggleButton value="all" aria-label="Mostrar todo">
            Todo
          </ToggleButton>
          <ToggleButton value="month" aria-label="Mostrar ultimo mes">
            Mes
          </ToggleButton>
          <ToggleButton value="week" aria-label="Mostrar ultima semana">
            Semana
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Paper elevation={0} className="dashboard_history_chart_paper">
        {chartContent}
      </Paper>
    </Box>
  );
};
