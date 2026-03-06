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
import {
  MainData,
  formatCurrency,
  formatDateDisplay,
} from "@/modules/dashboard/model/useItemCardModel";

interface DataTableProps {
  rows: MainData[];
  editable?: boolean;
  onRowsChange?: (rows: MainData[]) => void;
}

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
