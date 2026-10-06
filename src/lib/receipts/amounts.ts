// Amount rules for receipts (OCR-3). Pure functions: text in, `es-CO` formatted amount out.

// A value printed under the receipt's own label. "[^\n$\d]*\n?[^\n$\d]*" lets the amount sit on
// the same line or the next one, but stops at digits or a second line break, so when the amount
// line was not read it never picks up the "Costo del pago" line below it.
const LABELLED_AMOUNT =
  /valor\s+(?:del\s+pago|de\s+la\s+transferencia)[^\n$\d]*\n?[^\n$\d]*\$\s*(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d{4,9}(?:,\d{1,2})?)/i;

// Fallback candidates: Colombian format, `.` for thousands and `,` for decimals.
const CANDIDATE = /\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d{4,}(?:,\d{2})?/g;

const MIN_AMOUNT = 1000;
const MAX_DIGITS = 9;

function toNumber(value: string): number {
  return Number.parseFloat(value.replaceAll(".", "").replace(",", "."));
}

function isPlausibleAmount(value: string): boolean {
  const digitsOnly = value.replaceAll(/[.,]/g, "");
  return digitsOnly.length <= MAX_DIGITS && toNumber(value) >= MIN_AMOUNT;
}

function formatCOP(value: number): string {
  return value.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/**
 * Returns the receipt amount formatted as `es-CO`, or "" when none is readable. A value under the
 * receipt's own label wins; otherwise the largest plausible number in the text is used.
 */
export function extractAmount(text: string): string {
  const labelled = LABELLED_AMOUNT.exec(text)?.[1];
  if (labelled && isPlausibleAmount(labelled)) return formatCOP(toNumber(labelled));

  const candidates = (text.match(CANDIDATE) ?? []).filter(isPlausibleAmount);
  if (candidates.length === 0) return "";

  return formatCOP(Math.max(...candidates.map(toNumber)));
}

// Keeps one result per input, in order, so callers can match results to images by position.
export function extractAmounts(texts: string[]): string[] {
  return texts.map(extractAmount);
}
