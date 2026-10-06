// Review of an upload (OCR-5 to OCR-8, BOOK-5, BOOK-9). One entry per image, each with its own
// date and amount. Everything here is pure: the hook keeps the entries and the user's date
// confirmations, and derives the rest, so nothing about issues is stored or can go stale.
import { findDateOutliers } from "@/lib/receipts/dateOutliers";
import {
  dateRangeTitle,
  earliestIsoDate,
  sortEntriesByDate,
  toDayNumber,
} from "@/lib/receipts/dates";
import type { ReceiptRead } from "@/lib/receipts/readReceipt";
import type { MainData } from "@/types/dashboard";

export interface EntryIssues {
  missingDate: boolean;
  missingAmount: boolean;
  // Far from the other dates (OCR-8) and not confirmed by the user for the date it has now.
  dateOutlier: boolean;
}

export interface BookFromEntries {
  title: string;
  creationTime: string;
  content: MainData[];
}

const hasAmount = (money: string) => Boolean(money.trim()) && money !== "N/A";

export function needsAttention(issues: EntryIssues): boolean {
  return issues.missingDate || issues.missingAmount || issues.dateOutlier;
}

// "" means missing, for both fields.
export function entriesFromReads(
  reads: readonly Pick<ReceiptRead, "date" | "money">[]
): MainData[] {
  return reads.map((read, id) => ({ id, date: read.date ?? "", money: read.money }));
}

// Used when the OCR worker fails: every image is left for manual entry (OCR-6).
export function unreadableEntries(count: number): MainData[] {
  return Array.from({ length: count }, (_, id) => ({ id, date: "", money: "" }));
}

/**
 * Issues per entry id. A date flagged as an outlier stops being one once the user confirms it, but
 * only for the date they confirmed: `confirmedDates` maps id to that date, so changing the date
 * makes the confirmation stale and the entry is checked again.
 */
export function getEntryIssues(
  entries: readonly MainData[],
  confirmedDates: ReadonlyMap<number, string>
): Map<number, EntryIssues> {
  const outliers = findDateOutliers(entries);

  return new Map(
    entries.map((entry) => [
      entry.id,
      {
        missingDate: toDayNumber(entry.date) === null,
        missingAmount: !hasAmount(entry.money),
        dateOutlier: outliers.has(entry.id) && confirmedDates.get(entry.id) !== entry.date,
      },
    ])
  );
}

/**
 * Entries the carousel lists: those that needed attention when the upload was read, plus any that
 * need it now. Keeping the first group means an entry does not vanish from the carousel the moment
 * the user types the missing value into it.
 */
export function attentionEntries(
  entries: readonly MainData[],
  issues: ReadonlyMap<number, EntryIssues>,
  initialAttention: ReadonlySet<number>
): MainData[] {
  return entries.filter((entry) => {
    const entryIssues = issues.get(entry.id);
    return initialAttention.has(entry.id) || (entryIssues ? needsAttention(entryIssues) : false);
  });
}

// Save needs every entry to have a real date and an amount, and every outlier to be confirmed.
export function canSaveEntries(
  entries: readonly MainData[],
  issues: ReadonlyMap<number, EntryIssues>
): boolean {
  return (
    entries.length > 0 &&
    entries.every((entry) => {
      const entryIssues = issues.get(entry.id);
      return entryIssues !== undefined && !needsAttention(entryIssues);
    })
  );
}

export function describeEntryIssues(issues: EntryIssues): string | undefined {
  if (issues.missingDate && issues.missingAmount) {
    return "No pudimos leer bien esta imagen. Suele pasar cuando la foto está borrosa, oscura o cortada. Revisa la imagen y completa la fecha y el valor manualmente.";
  }

  if (issues.missingDate) {
    return "No pudimos leer la fecha de esta imagen. Revisa la imagen y escríbela manualmente.";
  }

  if (issues.missingAmount) {
    return "No pudimos leer bien el valor en esta imagen. Suele pasar cuando la foto está borrosa, oscura o cortada. Revisa la imagen e ingresa el valor manualmente.";
  }

  if (issues.dateOutlier) {
    return "Esta fecha está a más de 7 días de las demás fechas de este lote. Confírmala si es correcta o corrígela.";
  }

  return undefined;
}

// Parses a Colombian-format amount ("51.600", "1.234,50") or a plain typed one ("51600").
export function parseMoneyToNumber(value: string): number {
  const cleaned = value.replaceAll(/[^0-9.,-]/g, "");
  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma === -1 && lastDot === -1) return Number(cleaned) || 0;

  if (lastComma > -1 && lastDot === -1) {
    const decimalsLength = cleaned.length - lastComma - 1;
    if (decimalsLength === 3) return Number(cleaned.replaceAll(",", "")) || 0;
    return Number(cleaned.replaceAll(",", ".")) || 0;
  }

  if (lastDot > -1 && lastComma === -1) {
    const decimalsLength = cleaned.length - lastDot - 1;
    if (decimalsLength === 3) return Number(cleaned.replaceAll(".", "")) || 0;
    return Number(cleaned) || 0;
  }

  if (lastComma > lastDot) {
    return Number(cleaned.replaceAll(".", "").replaceAll(",", ".")) || 0;
  }

  return Number(cleaned.replaceAll(",", "")) || 0;
}

export function formatMoneyForSave(value: string): string {
  return parseMoneyToNumber(value).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * The book an upload becomes (BOOK-5, BOOK-9): entries in ascending date order with amounts
 * formatted as `es-CO`, titled by their date range and dated by the lowest one. Returns null when
 * there is nothing to save or no entry has a real date, so the caller never saves a dateless book.
 */
export function buildBookFromEntries(entries: readonly MainData[]): BookFromEntries | null {
  const dates = entries.map((entry) => entry.date);
  const title = dateRangeTitle(dates);
  const creationTime = earliestIsoDate(dates);
  if (entries.length === 0 || !title || !creationTime) return null;

  const content = sortEntriesByDate(entries).map((entry) => ({
    ...entry,
    money: formatMoneyForSave(entry.money),
  }));

  return { title, creationTime, content };
}
