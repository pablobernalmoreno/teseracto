// CSV export of a book (DASH-5). Same layout as the book table: one column per date with that
// day's amounts below, then Ganancias, and a last row with each day's total and the grand total.
import { groupRowsByDate } from "@/lib/receipts/bookDates";
import { dashboardService } from "./dashboardService";
import { parseMoneyToNumber } from "./reviewEntries";
import { formatDateDisplay } from "./useItemCardModel";
import type { MainData } from "@/types/dashboard";

export interface ExportCsvOptions {
  bookId: string | number;
  bookTitle: string;
  /** Pre-loaded rows. If omitted, they will be fetched from the API. */
  rows?: MainData[];
}

// Semicolon separator and decimal comma: what Spanish-locale Excel splits and sums correctly.
const SEPARATOR = ";";
const LINE_BREAK = "\r\n";
const BOM = "﻿";

function csvCell(value: string): string {
  return /[;"\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

// A plain number with a decimal comma, rounded so a sum never shows float noise.
function formatNumber(value: number): string {
  return String(Math.round(value * 100) / 100).replace(".", ",");
}

const sumMoney = (rows: readonly MainData[]) =>
  rows.reduce((sum, row) => sum + parseMoneyToNumber(row.money), 0);

/**
 * The CSV text (without the BOM) for a book's entries. Columns come from `groupRowsByDate`, the
 * same grouping the table uses, so the file and the screen cannot disagree. An entry with no amount
 * leaves its cell empty instead of counting as 0.
 */
export function buildBookCsv(rows: readonly MainData[], bookDate = ""): string {
  const columns = groupRowsByDate(rows, bookDate);
  const lineCount = Math.max(0, ...columns.map((column) => column.rows.length));

  const header = [
    ...columns.map((column) => (column.iso ? formatDateDisplay(column.iso) : "Sin fecha")),
    "Ganancias",
  ];
  const body = Array.from({ length: lineCount }, (_, line) => [
    ...columns.map((column) => {
      const money = column.rows[line]?.money ?? "";
      return money.trim() ? formatNumber(parseMoneyToNumber(money)) : "";
    }),
    "",
  ]);
  const totals = [...columns.map((column) => formatNumber(sumMoney(column.rows))), ""];
  totals[totals.length - 1] = formatNumber(sumMoney(rows));

  return [header, ...body, totals]
    .map((line) => line.map(csvCell).join(SEPARATOR))
    .join(LINE_BREAK);
}

export async function exportBookToCsv(options: ExportCsvOptions): Promise<void> {
  const { bookId, bookTitle } = options;

  let rows = options.rows;

  // Fetch full content if not provided
  if (!rows || rows.length === 0) {
    const result = await dashboardService.fetchBookContent(bookId);
    if (result.error || !result.data) {
      throw new Error(result.error?.message ?? "No se pudo cargar el contenido del libro.");
    }
    rows = result.data.content ?? [];
  }

  const blob = new Blob([BOM + buildBookCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const safeName = bookTitle.replaceAll(/[^a-zA-Z0-9_\-À-ɏ ]/g, "").trim();

  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName || "libro"}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
