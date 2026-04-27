import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import { dashboardService } from "@/features/dashboard/model/dashboardService";
import { formatCurrency, formatDateDisplay } from "@/features/dashboard/model/useItemCardModel";
import type { MainData } from "@/types/dashboard";

export interface ExportPdfOptions {
  bookId: string | number;
  bookTitle: string;
  /** Pre-loaded rows. If omitted, they will be fetched from the API. */
  rows?: MainData[];
}

function parseMoneyToNumber(value: string | number): number {
  if (typeof value === "number") return value;
  const str = String(value || "").trim();
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

export async function exportBookToPdf(options: ExportPdfOptions): Promise<void> {
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

  const total = rows.reduce((sum, r) => sum + parseMoneyToNumber(r.money), 0);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;

  // ── Header ──────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(37, 49, 42); // --color-text-primary
  doc.text(bookTitle, marginX, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(98, 113, 107); // --color-text-secondary
  doc.text(`Estos fueron los ingresos del ${bookTitle?.toLowerCase()}.`, marginX, 29);

  // Date generated
  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generado el ${dateStr}`, pageWidth - marginX, 20, { align: "right" });

  // Divider
  doc.setDrawColor(89, 120, 98);
  doc.setLineWidth(0.4);
  doc.line(marginX, 33, pageWidth - marginX, 33);

  // ── Table ────────────────────────────────────────────
  const tableRows = rows.map((r) => [formatDateDisplay(r.date), formatCurrency(r.money)]);

  autoTable(doc, {
    startY: 38,
    head: [["Fecha", "Monto"]],
    body: tableRows,
    margin: { left: marginX, right: marginX },
    styles: {
      font: "helvetica",
      fontSize: 10,
      textColor: [37, 49, 42],
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 159, 73], // --color-accent
      textColor: [245, 255, 246],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [238, 244, 239], // --color-surface-muted
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { halign: "right" },
    },
  });

  // ── Total ─────────────────────────────────────────────
  const finalY: number =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 38;

  doc.setDrawColor(89, 120, 98);
  doc.setLineWidth(0.3);
  doc.line(marginX, finalY + 4, pageWidth - marginX, finalY + 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(37, 49, 42);
  doc.text("Total:", marginX, finalY + 11);
  doc.text(formatCurrency(total), pageWidth - marginX, finalY + 11, { align: "right" });

  // ── Save ──────────────────────────────────────────────
  const safeName = bookTitle.replaceAll(/[^a-zA-Z0-9_\-\u00C0-\u024F ]/g, "").trim();
  doc.save(`${safeName || "libro"}.pdf`);
}
