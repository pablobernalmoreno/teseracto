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

// A `timestamptz` read back as text: "2026-03-01 00:00:00+00" (Postgres) or an ISO string.
const UTC_MIDNIGHT = /^(\d{4}-\d{2}-\d{2})[T ]00:00:00(?:\.0+)?(?:Z|\+00(?::?00)?)$/;
const PG_DATE_TIME_GAP = /^(\d{4}-\d{2}-\d{2}) /;
const PG_SHORT_OFFSET = /([+-]\d{2})$/;

/**
 * The `yyyy-MM-dd` day of a stored book date (BOOK-5). A book is saved with a date-only value,
 * which the database keeps as UTC midnight, so that instant is read by its UTC day: reading it in
 * a timezone west of UTC would show the day before. Any other timestamp (books saved before the
 * date-only write) keeps being read in the local timezone. "" when it is not a date.
 */
export function storedDateToIso(stored: string | undefined): string {
  const value = (stored ?? "").trim();
  if (ISO_DATE.test(value)) return value;

  const midnight = UTC_MIDNIGHT.exec(value);
  if (midnight) return midnight[1];

  // Postgres writes a space and a bare "+00" offset, which not every browser parses.
  const parsed = new Date(value.replace(PG_DATE_TIME_GAP, "$1T").replace(PG_SHORT_OFFSET, "$1:00"));
  if (Number.isNaN(parsed.getTime())) return "";

  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${parsed.getFullYear()}-${month}-${day}`;
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
    const column = columns.get(iso);
    if (column) column.push(row);
    else columns.set(iso, [row]);
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
