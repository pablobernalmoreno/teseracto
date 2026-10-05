// Date rules for receipts (OCR-2). Pure functions: text in, `dd/MM/yyyy` out.

// Spanish month names. A token in the text matches a month when it is at least three letters and
// a prefix of the name, so "sep", "sept" and "septiembre" are all September. "setiembre" is the
// alternative spelling, which also makes "set" September.
const MONTH_NAMES: readonly string[] = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const MONTH_ALIASES: Readonly<Record<string, number>> = { setiembre: 9 };

// `(?<!\d)` stops a day being read out of the tail of a longer number ("245sept" is not day 45).
const WRITTEN_DATE =
  /(?<!\d)(\d{1,2})\s*(?:de\s+)?([a-zñáéíóú]{3,11})\.?\s*(?:de\s+)?(20\d{2})(?!\d)/gi;
const SLASH_DATE = /(?<!\d)(\d{2})\/(\d{2})\/(20\d{2})(?!\d)/g;

function stripAccents(value: string): string {
  return value.normalize("NFD").replaceAll(/[̀-ͯ]/g, "");
}

function monthFromToken(token: string): number | null {
  const normalized = stripAccents(token.toLowerCase());
  const index = MONTH_NAMES.findIndex((name) => name.startsWith(normalized));
  if (index !== -1) return index + 1;

  const aliasEntry = Object.entries(MONTH_ALIASES).find(([name]) => name.startsWith(normalized));
  return aliasEntry ? aliasEntry[1] : null;
}

// `new Date` rolls an impossible day over (31 Feb becomes 3 Mar), so compare the parts back.
function isRealDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  const candidate = new Date(year, month - 1, day);
  return (
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day
  );
}

function formatParts(year: number, month: number, day: number): string {
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

/**
 * Returns the first real date in the text as `dd/MM/yyyy`, or null. Fails closed: text that looks
 * like a date but is not a real calendar day ("45 sept 2026", "31/02/2026") counts as no date, so
 * the user types it in instead of the book receiving an invalid one.
 */
export function extractDate(text: string): string | null {
  for (const match of text.matchAll(WRITTEN_DATE)) {
    const month = monthFromToken(match[2]);
    if (month === null) continue;

    const day = Number(match[1]);
    const year = Number(match[3]);
    if (isRealDate(year, month, day)) return formatParts(year, month, day);
  }

  for (const match of text.matchAll(SLASH_DATE)) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (isRealDate(year, month, day)) return formatParts(year, month, day);
  }

  return null;
}

// Keeps one result per input, in order, so callers can match results to images by position.
export function extractDates(texts: string[]): (string | null)[] {
  return texts.map(extractDate);
}

const DISPLAY_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const MS_PER_DAY = 86_400_000;

/**
 * Whole days since the epoch for a `dd/MM/yyyy` date, or null when the text is not a real date.
 * Computed in UTC so differences are exact calendar days regardless of the local time zone.
 */
export function toDayNumber(display: string): number | null {
  const match = DISPLAY_DATE.exec(display.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!isRealDate(year, month, day)) return null;

  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

function datedEntries(dates: string[]): { display: string; day: number }[] {
  return dates.flatMap((display) => {
    const day = toDayNumber(display);
    return day === null ? [] : [{ display, day }];
  });
}

/**
 * Title of a book made from an upload (BOOK-5): `dd/MM/yyyy - dd/MM/yyyy` from the lowest to the
 * highest date, or a single `dd/MM/yyyy` when they coincide. Dates that are not real are ignored;
 * returns "" when none are, and the caller decides what to do then.
 */
export function dateRangeTitle(dates: string[]): string {
  const dated = datedEntries(dates);
  if (dated.length === 0) return "";

  const first = dated.reduce((low, item) => (item.day < low.day ? item : low));
  const last = dated.reduce((high, item) => (item.day > high.day ? item : high));
  return first.day === last.day ? first.display : `${first.display} - ${last.display}`;
}

// The book's creation date: the lowest entry date as `yyyy-MM-dd`, or null when there is none.
export function earliestIsoDate(dates: string[]): string | null {
  const dated = datedEntries(dates);
  if (dated.length === 0) return null;

  const first = dated.reduce((low, item) => (item.day < low.day ? item : low));
  const [day, month, year] = first.display.split("/");
  return `${year}-${month}-${day}`;
}

/**
 * Entries in ascending date order (BOOK-9). Entries with the same date keep their input order,
 * which is the upload order; entries without a real date go last instead of being dropped.
 */
export function sortEntriesByDate<T extends { date: string }>(entries: readonly T[]): T[] {
  return entries
    .map((entry, index) => ({ entry, index, day: toDayNumber(entry.date) }))
    .sort((a, b) => {
      if (a.day === null && b.day === null) return a.index - b.index;
      if (a.day === null) return 1;
      if (b.day === null) return -1;
      return a.day - b.day || a.index - b.index;
    })
    .map(({ entry }) => entry);
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// `yyyy-MM-dd` (the value of an <input type="date">) to `dd/MM/yyyy`; "" when not a real date,
// which is also what the input reports while the user is still typing.
export function isoToDisplay(iso: string): string {
  const match = ISO_DATE.exec(iso);
  if (!match) return "";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return isRealDate(year, month, day) ? formatParts(year, month, day) : "";
}

// `dd/MM/yyyy` to `yyyy-MM-dd` for an <input type="date">; "" when not a real date.
export function displayToIso(display: string): string {
  if (toDayNumber(display) === null) return "";

  const [day, month, year] = display.trim().split("/");
  return `${year}-${month}-${day}`;
}
