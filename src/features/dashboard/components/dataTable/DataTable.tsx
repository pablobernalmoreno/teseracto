import React, { useMemo, useState, useCallback } from "react";
import {
  Button,
  IconButton,
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
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { formatCurrency, formatDateDisplay } from "@/features/dashboard/model/useItemCardModel";
import {
  anyDateToIso,
  groupRowsByDate,
  moveColumnDate,
  nextFreeDate,
  type DateColumn,
} from "@/lib/receipts/bookDates";
import type { MainData } from "@/types/dashboard";
import "./DataTableStyles.css";

interface DataTableProps {
  rows: MainData[];
  mode?: "view" | "edit";
  fixedDate?: string;
  onRowsChange?: (rows: MainData[]) => void;
}

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

const sumMoney = (rows: readonly MainData[]) =>
  rows.reduce((sum, row) => sum + parseMoneyToNumber(row.money), 0);

// One column per date, then Ganancias (BOOK-11). The data stays one `{ id, date, money }` entry per
// receipt; the columns are only how the entries are laid out.
export const DataTable: React.FC<DataTableProps> = React.memo(
  ({ rows, mode = "view", fixedDate, onRowsChange }) => {
    const editable = mode === "edit";
    const [focusedMoneyId, setFocusedMoneyId] = useState<number | null>(null);
    const [newRowIds, setNewRowIds] = useState<Set<number>>(new Set());
    const [editedRowIds, setEditedRowIds] = useState<Set<number>>(new Set());

    const columns = useMemo(() => groupRowsByDate(rows, fixedDate), [rows, fixedDate]);
    const lineCount = Math.max(0, ...columns.map((column) => column.rows.length));
    const totalGanancias = sumMoney(rows);
    // Header cells: one per date column, plus Ganancias, plus the delete column when editing.
    const columnCount = columns.length + 1;

    const handleMoneyChange = useCallback(
      (rowId: number, value: string) => {
        if (!onRowsChange) return;
        const numericOnlyValue = value.replaceAll(/[^0-9.,]/g, "");
        setEditedRowIds((prev) => new Set(prev).add(rowId));
        onRowsChange(
          rows.map((row) => (row.id === rowId ? { ...row, money: numericOnlyValue } : row))
        );
      },
      [rows, onRowsChange]
    );

    const handleColumnDateChange = useCallback(
      (column: DateColumn<MainData>, value: string) => {
        if (!onRowsChange) return;
        // moveColumnDate ignores a half-typed date, so the columns only change on a real one.
        const next = moveColumnDate(rows, column.iso, value, fixedDate);
        for (const row of column.rows) {
          if (typeof row.id === "number") setEditedRowIds((prev) => new Set(prev).add(row.id));
        }
        onRowsChange(next);
      },
      [rows, fixedDate, onRowsChange]
    );

    const addRow = useCallback(
      (date: string) => {
        if (!onRowsChange) return;
        // Unique even when two rows are added within the same millisecond.
        const newRowId = Math.max(Date.now(), ...rows.map((row) => Number(row.id) + 1 || 0));
        setNewRowIds((prev) => new Set(prev).add(newRowId));
        onRowsChange([...rows, { id: newRowId, date, money: "" }]);
      },
      [rows, onRowsChange]
    );

    const handleAddInColumn = useCallback(
      (column: DateColumn<MainData>) => addRow(column.iso),
      [addRow]
    );

    // A new date column starts the day after the last one; the user then sets its real date.
    const handleAddColumn = useCallback(
      () => addRow(nextFreeDate(rows) || anyDateToIso(fixedDate)),
      [addRow, rows, fixedDate]
    );

    const handleRemoveRow = useCallback(
      (rowId: number) => {
        if (!onRowsChange) return;
        setNewRowIds((prev) => {
          const next = new Set(prev);
          next.delete(rowId);
          return next;
        });
        setEditedRowIds((prev) => {
          const next = new Set(prev);
          next.delete(rowId);
          return next;
        });
        onRowsChange(rows.filter((row) => row.id !== rowId));
      },
      [rows, onRowsChange]
    );

    const getCellClassName = (rowId: number) => {
      if (newRowIds.has(rowId)) return "data-table-cell-new";
      if (editedRowIds.has(rowId)) return "data-table-cell-edited";
      return "";
    };

    const columnLabel = (column: DateColumn<MainData>) =>
      column.iso ? formatDateDisplay(column.iso) : "Sin fecha";

    const renderHeaderCell = (column: DateColumn<MainData>, index: number) => {
      const key = column.rows[0]?.id ?? `column-${index}`;
      if (!editable) {
        return (
          <TableCell key={key} align="right">
            {columnLabel(column)}
          </TableCell>
        );
      }

      return (
        <TableCell key={key} align="right">
          <TextField
            size="small"
            type="date"
            value={column.iso}
            onChange={(e) => handleColumnDateChange(column, e.target.value)}
            slotProps={{
              htmlInput: { "aria-label": `Fecha de la columna ${index + 1}` },
            }}
          />
        </TableCell>
      );
    };

    const renderMoneyCell = (column: DateColumn<MainData>, row: MainData | undefined) => {
      if (!row) return null;
      if (!editable) return <span>{formatCurrency(row.money)}</span>;

      return (
        <div className="data-table-money-cell">
          <TextField
            size="small"
            placeholder="Valor"
            value={focusedMoneyId === row.id ? row.money : formatCurrency(row.money)}
            onFocus={() => setFocusedMoneyId(row.id)}
            onBlur={() => setFocusedMoneyId(null)}
            onChange={(e) => handleMoneyChange(row.id, e.target.value)}
            slotProps={{
              htmlInput: {
                inputMode: "decimal",
                pattern: "[0-9.,]*",
                "aria-label": `Ganancias del ${columnLabel(column)}`,
              },
              input: {
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              },
            }}
          />
          <IconButton
            size="small"
            color="error"
            onClick={() => handleRemoveRow(row.id)}
            aria-label={`Eliminar valor del ${columnLabel(column)}`}
          >
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </div>
      );
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
              {columns.map(renderHeaderCell)}
              <TableCell align="right" className="data-table-total-col">
                Ganancias
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {columns.length === 0 && (
              <TableRow>
                <TableCell colSpan={columnCount} align="center">
                  Sin datos
                </TableCell>
              </TableRow>
            )}
            {Array.from({ length: lineCount }, (_, line) => (
              <TableRow key={line}>
                {columns.map((column, index) => {
                  const row = column.rows[line];
                  return (
                    <TableCell
                      key={column.rows[0]?.id ?? `column-${index}`}
                      align="right"
                      className={row ? getCellClassName(row.id) : ""}
                    >
                      {renderMoneyCell(column, row)}
                    </TableCell>
                  );
                })}
                <TableCell className="data-table-total-col" />
              </TableRow>
            ))}
            {editable && (
              <TableRow>
                {columns.map((column, index) => (
                  <TableCell
                    key={column.rows[0]?.id ?? `column-${index}`}
                    align="right"
                    className="data-table-add-cell"
                  >
                    <Button
                      onClick={() => handleAddInColumn(column)}
                      size="small"
                      variant="text"
                      aria-label={`Agregar un valor al ${columnLabel(column)}`}
                    >
                      Nuevo dato +
                    </Button>
                  </TableCell>
                ))}
                <TableCell className="data-table-add-cell data-table-total-col">
                  <Button
                    onClick={handleAddColumn}
                    size="small"
                    variant="text"
                    aria-label="Agregar una nueva fecha"
                  >
                    Nueva fecha +
                  </Button>
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              {columns.map((column, index) => (
                <TableCell
                  key={column.rows[0]?.id ?? `column-${index}`}
                  align="right"
                  className="data-table-total-cell"
                >
                  {formatCurrency(sumMoney(column.rows))}
                </TableCell>
              ))}
              <TableCell align="right" className="data-table-total-cell data-table-total-col">
                Total: {formatCurrency(totalGanancias)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
);

DataTable.displayName = "DataTable";

export default DataTable;
