// Test-only oracle for the sample receipts: the file name carries the expected values
// (`dd-mm-yyyy-amount`, with an optional `-N` suffix when the same date and amount repeat).
// The app never reads file names (OCR-10); `eslint.config.mjs` bans importing this from `src/`.
export interface ExpectedReceipt {
  date: string;
  money: string;
}

const FILENAME_PATTERN = /^(\d{2})-(\d{2})-(\d{4})-([\d.]+)(?:-\d+)?\.\w+$/;

// Fails closed: a name that does not follow the convention yields null, never a guess.
export function expectedFromFilename(fileName: string): ExpectedReceipt | null {
  const match = FILENAME_PATTERN.exec(fileName);
  if (!match) return null;

  const [, day, month, year, money] = match;
  return { date: `${day}/${month}/${year}`, money };
}
