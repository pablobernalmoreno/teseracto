import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
} from "@mui/material";
import { MainData } from "@/modules/dashboard/model/useItemCardModel";

interface DataTableProps {
  rows: MainData[];
  editable?: boolean;
  onRowsChange?: (rows: MainData[]) => void;
}

// Format date for display as dd/mm/yyyy
const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return "--/--/----";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, "0");
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const y = parsed.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return dateStr;
};

// Format numeric-like strings into a thousands-separated string (no rounding)
const formatCurrency = (raw: string | number): string => {
  const parseNumberParts = (s: string | number) => {
    if (typeof s === "number") return { intPart: String(Math.trunc(s)), fracPart: undefined };
    let str = String(s || "").trim();
    if (!str) return { intPart: "", fracPart: undefined };
    const cleaned = str.replace(/[^0-9.,-]/g, "");
    if (!cleaned) return { intPart: "", fracPart: undefined };

    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");

    if (lastComma === -1 && lastDot === -1) return { intPart: cleaned, fracPart: undefined };
    if (lastComma > -1 && lastDot === -1) {
      const decimalsLen = cleaned.length - lastComma - 1;
      if (decimalsLen === 3) return { intPart: cleaned.replace(/,/g, ""), fracPart: undefined };
      return { intPart: cleaned.slice(0, lastComma).replace(/\./g, ""), fracPart: cleaned.slice(lastComma + 1) };
    }
    if (lastDot > -1 && lastComma === -1) {
      const decimalsLen = cleaned.length - lastDot - 1;
      if (decimalsLen === 3) return { intPart: cleaned.replace(/\./g, ""), fracPart: undefined };
      return { intPart: cleaned.slice(0, lastDot).replace(/,/g, ""), fracPart: cleaned.slice(lastDot + 1) };
    }
    if (lastComma > lastDot) return { intPart: cleaned.slice(0, lastComma).replace(/\./g, ""), fracPart: cleaned.slice(lastComma + 1) };
    return { intPart: cleaned.slice(0, lastDot).replace(/,/g, ""), fracPart: cleaned.slice(lastDot + 1) };
  };

  const parts = parseNumberParts(raw);
  const intFormatted = parts.intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.fracPart ? `${intFormatted}.${parts.fracPart}` : intFormatted;
};

export const DataTable: React.FC<DataTableProps> = ({ rows, editable = false, onRowsChange }) => {
  const [focusedMoneyIndex, setFocusedMoneyIndex] = useState<number | null>(null);

  const handleChange = (index: number, field: "date" | "money", value: string) => {
    if (!onRowsChange) return;
    const copy = rows.map((r) => ({ ...r }));
    if (field === "date") copy[index] = { ...copy[index], date: value } as MainData;
    else copy[index] = { ...copy[index], money: value } as MainData;
    onRowsChange(copy);
  };

  return (
    <TableContainer component={Paper} elevation={0}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell align="right">Ganancias</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row, idx) => (
              <TableRow key={row.id ?? idx}>
                <TableCell>
                  {editable ? (
                    <TextField
                      size="small"
                      type="date"
                      value={row.date}
                      onChange={(e) => handleChange(idx, "date", e.target.value)}
                    />
                  ) : (
                    <span>{formatDateDisplay(row.date)}</span>
                  )}
                </TableCell>
                <TableCell align="right">
                  {editable ? (
                    <TextField
                      size="small"
                      value={focusedMoneyIndex === idx ? row.money : formatCurrency(row.money)}
                      onFocus={() => setFocusedMoneyIndex(idx)}
                      onBlur={() => setFocusedMoneyIndex(null)}
                      onChange={(e) => handleChange(idx, "money", e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      }}
                    />
                  ) : (
                    <span>{formatCurrency(row.money)}</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={2} align="center">
                Sin datos
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataTable;
