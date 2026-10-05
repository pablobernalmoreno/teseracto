// Dates of the rows of a saved book (BOOK-10). A book can span several days, so each row keeps its
// own date. Rows hold either `dd/MM/yyyy` (made by an upload) or `yyyy-MM-dd` (typed in the table);
// every helper accepts both and a shifted row keeps the format it had.
import { dateRangeTitle, earliestIsoDate, isoToDisplay, toDayNumber } from "./dates";

interface DatedRow {
  date?: string;
}

const MS_PER_DAY = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// `yyyy-MM-dd` for a real date in either stored format, "" otherwise.
export function anyDateToIso(date: string | undefined): string {
  const value = (date ?? "").trim();
  if (ISO_DATE.test(value)) return isoToDisplay(value) ? value : "";

  const display = value;
  if (toDayNumber(display) === null) return "";
  const [day, month, year] = display.split("/");
  return `${year}-${month}-${day}`;
}

const rowDisplayDates = (rows: readonly DatedRow[]) =>
  rows.map((row) => isoToDisplay(anyDateToIso(row.date)));

// The book's creation date: the lowest row date, or "" when no row has a real date.
export function earliestRowDate(rows: readonly DatedRow[]): string {
  return earliestIsoDate(rowDisplayDates(rows)) ?? "";
}

// Title for a book whose rows span several days; "" for one day or none, so callers keep their own.
export function rowsRangeTitle(rows: readonly DatedRow[]): string {
  const title = dateRangeTitle(rowDisplayDates(rows));
  return title.includes(" - ") ? title : "";
}

export function fillMissingDates<T extends DatedRow>(rows: readonly T[], isoDate: string): T[] {
  return rows.map((row) => (anyDateToIso(row.date) || !isoDate ? row : { ...row, date: isoDate }));
}

/**
 * Moves the book from one date to another: every row with a real date shifts by the same number of
 * days, so a week stays a week. Rows without a real date take the new date. Complement: when the
 * previous date is unknown there is no offset to apply, so only the blank rows change.
 */
export function shiftRowDates<T extends DatedRow>(
  rows: readonly T[],
  fromIso: string,
  toIso: string
): T[] {
  const from = toDayNumber(isoToDisplay(fromIso));
  const to = toDayNumber(isoToDisplay(toIso));
  if (to === null) return [...rows];
  const offset = from === null ? 0 : to - from;

  return rows.map((row) => {
    const iso = anyDateToIso(row.date);
    if (!iso) return { ...row, date: toIso };

    const day = toDayNumber(isoToDisplay(iso));
    if (day === null || offset === 0) return row;

    const shifted = new Date((day + offset) * MS_PER_DAY).toISOString().slice(0, 10);
    return { ...row, date: ISO_DATE.test(row.date ?? "") ? shifted : isoToDisplay(shifted) };
  });
}

export interface DateColumn<T> {
  // `yyyy-MM-dd`, or "" for the entries that have no real date.
  iso: string;
  rows: T[];
}

/**
 * Groups entries into one column per distinct date, in ascending date order, with the undated
 * entries last (BOOK-11). Entries keep their order inside a column. `fallbackIso` is the date an
 * entry without one is shown under.
 */
export function groupRowsByDate<T extends DatedRow>(
  rows: readonly T[],
  fallbackIso = ""
): DateColumn<T>[] {
  const columns = new Map<string, T[]>();
  for (const row of rows) {
    const iso = anyDateToIso(row.date) || anyDateToIso(fallbackIso);
    columns.set(iso, [...(columns.get(iso) ?? []), row]);
  }

  return [...columns.entries()]
    .sort(([a], [b]) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b)))
    .map(([iso, columnRows]) => ({ iso, rows: columnRows }));
}

/**
 * Gives every entry of one column a new date. When another column already has that date the two
 * become one, because columns are just the distinct dates. An invalid new date changes nothing
 * (fails closed: a half-typed date never moves entries).
 */
export function moveColumnDate<T extends DatedRow>(
  rows: readonly T[],
  fromIso: string,
  toIso: string,
  fallbackIso = ""
): T[] {
  if (!anyDateToIso(toIso)) return [...rows];

  return rows.map((row) =>
    (anyDateToIso(row.date) || anyDateToIso(fallbackIso)) === fromIso
      ? { ...row, date: toIso }
      : row
  );
}

// The day after the latest entry date, for a new column; "" when no entry has a real date.
export function nextFreeDate(rows: readonly DatedRow[]): string {
  const days = rows
    .map((row) => toDayNumber(isoToDisplay(anyDateToIso(row.date))))
    .filter((day): day is number => day !== null);
  if (days.length === 0) return "";

  return new Date((Math.max(...days) + 1) * MS_PER_DAY).toISOString().slice(0, 10);
}
