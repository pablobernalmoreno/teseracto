import React, { useMemo, useState, useCallback } from "react";
import {
  Button,
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
import { formatCurrency, formatDateDisplay } from "@/features/dashboard/model/useItemCardModel";
import type { MainData } from "@/types/dashboard";
import "./DataTableStyles.css";

interface DataTableProps {
  rows: MainData[];
  mode?: "view" | "edit";
  onRowsChange?: (rows: MainData[]) => void;
}

export const DataTable: React.FC<DataTableProps> = React.memo(
  ({ rows, mode = "view", onRowsChange }) => {
    const editable = mode === "edit";
    const [focusedMoneyIndex, setFocusedMoneyIndex] = useState<number | null>(null);
    const [newRowIds, setNewRowIds] = useState<Set<number>>(new Set());
    const [editedRowIds, setEditedRowIds] = useState<Set<number>>(new Set());

    const parseCommaDecimalFormat = (cleaned: string, lastComma: number): number => {
      const decimalsLen = cleaned.length - lastComma - 1;
      if (decimalsLen === 3) return Number(cleaned.replaceAll(",", "")) || 0;
      return Number(cleaned.replaceAll(",", ".")) || 0;
    };

    const parseDotDecimalFormat = (cleaned: string, lastDot: number): number => {
      const decimalsLen = cleaned.length - lastDot - 1;
      if (decimalsLen === 3) return Number(cleaned.replaceAll(".", "")) || 0;
      return Number(cleaned) || 0;
    };

    const parseMoneyToNumber = (value: string | number): number => {
      if (typeof value === "number") return value;
      const str = String(value || "").trim();
      if (!str) return 0;

      const cleaned = str.replaceAll(/[^0-9.,-]/g, "");
      if (!cleaned) return 0;

      const lastComma = cleaned.lastIndexOf(",");
      const lastDot = cleaned.lastIndexOf(".");

      if (lastComma === -1 && lastDot === -1) return Number(cleaned) || 0;
      if (lastComma > -1 && lastDot === -1) return parseCommaDecimalFormat(cleaned, lastComma);
      if (lastDot > -1 && lastComma === -1) return parseDotDecimalFormat(cleaned, lastDot);

      if (lastComma > lastDot) {
        const normalized = cleaned.replaceAll(".", "").replaceAll(",", ".");
        return Number(normalized) || 0;
      }

      const normalized = cleaned.replaceAll(",", "");
      return Number(normalized) || 0;
    };

    const totalGanancias = rows.reduce((sum, row) => sum + parseMoneyToNumber(row.money), 0);

    const existingIds = useMemo(() => new Set(rows.map((row) => row.id)), [rows]);

    // Filter tracking sets to only include IDs that exist in current dataset
    const filteredNewRowIds = useMemo(
      () => new Set([...newRowIds].filter((id) => existingIds.has(id))),
      [newRowIds, existingIds]
    );

    const filteredEditedRowIds = useMemo(
      () => new Set([...editedRowIds].filter((id) => existingIds.has(id))),
      [editedRowIds, existingIds]
    );

    const handleChange = useCallback(
      (index: number, field: "date" | "money", value: string) => {
        if (!onRowsChange) return;
        const rowId = rows[index]?.id;
        const copy = rows.map((r) => ({ ...r }));
        if (field === "date") copy[index] = { ...copy[index], date: value } as MainData;
        else copy[index] = { ...copy[index], money: value } as MainData;
        if (typeof rowId === "number") {
          setEditedRowIds((prev) => new Set(prev).add(rowId));
        }
        onRowsChange(copy);
      },
      [rows, onRowsChange]
    );

    const handleMoneyChange = useCallback(
      (index: number, value: string) => {
        const numericOnlyValue = value.replaceAll(/[^0-9.,]/g, "");
        handleChange(index, "money", numericOnlyValue);
      },
      [handleChange]
    );

    const handleAddRow = useCallback(() => {
      if (!onRowsChange) return;
      const newRowId = Date.now();
      const newRow: MainData = {
        id: newRowId,
        date: "",
        money: "",
      };
      setNewRowIds((prev) => new Set(prev).add(newRowId));
      onRowsChange([...rows, newRow]);
    }, [rows, onRowsChange]);

    const handleFocusMoneyIndex = useCallback((idx: number) => {
      setFocusedMoneyIndex(idx);
    }, []);

    const handleBlurMoneyIndex = useCallback(() => {
      setFocusedMoneyIndex(null);
    }, []);

    const renderDateCell = (row: MainData, idx: number) => {
      if (!editable) return <span>{formatDateDisplay(row.date)}</span>;

      return (
        <TextField
          label="Fecha"
          size="small"
          type="date"
          value={row.date}
          onChange={(e) => handleChange(idx, "date", e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      );
    };

    const renderMoneyCell = (row: MainData, idx: number) => {
      if (!editable) return <span>{formatCurrency(row.money)}</span>;

      return (
        <TextField
          label="Ganancias"
          size="small"
          value={focusedMoneyIndex === idx ? row.money : formatCurrency(row.money)}
          onFocus={() => handleFocusMoneyIndex(idx)}
          onBlur={handleBlurMoneyIndex}
          onChange={(e) => handleMoneyChange(idx, e.target.value)}
          slotProps={{
            htmlInput: { inputMode: "decimal", pattern: "[0-9.,]*" },
            input: {
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            },
          }}
        />
      );
    };

    const renderTableRow = (row: MainData, idx: number) => {
      const rowClassName = editable ? getRowClassName(row.id) : "";

      return (
        <TableRow key={row.id ?? idx} className={rowClassName}>
          <TableCell>{renderDateCell(row, idx)}</TableCell>
          <TableCell align="right">{renderMoneyCell(row, idx)}</TableCell>
        </TableRow>
      );
    };

    const getRowClassName = (rowId: number) => {
      if (!existingIds.has(rowId)) return "";
      if (filteredNewRowIds.has(rowId)) return "data-table-row-new";
      if (filteredEditedRowIds.has(rowId)) return "data-table-row-edited";
      return "";
    };

    return (
      <TableContainer component={Paper} elevation={0} className="dashboard-table-container">
        <Table
          size="small"
          className="dashboard-table"
          aria-label={mode === "edit" ? "Tabla editable de datos" : "Vista previa de datos"}
        >
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell align="right">Ganancias</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row, idx) => renderTableRow(row, idx))
            ) : (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  Sin datos
                </TableCell>
              </TableRow>
            )}
            {editable && (
              <TableRow>
                <TableCell className="data-table-add-cell">
                  <Button
                    onClick={handleAddRow}
                    size="small"
                    variant="text"
                    aria-label="Agregar una nueva fila de datos"
                  >
                    Nuevo dato +
                  </Button>
                </TableCell>
                <TableCell align="right" className="data-table-total-cell">
                  Total: {formatCurrency(totalGanancias)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
);

DataTable.displayName = "DataTable";

export default DataTable;
