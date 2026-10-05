import { toDayNumber } from "./dates";

// An entry is flagged when its date is strictly more than this many days from the reference.
export const OUTLIER_DAYS = 7;

// With fewer dated entries than this, the median says little, so each date is compared with its
// nearest other date instead.
const MIN_ENTRIES_FOR_MEDIAN = 3;

export interface DatedEntry {
  id: number;
  date: string;
}

function median(sortedDays: number[]): number {
  const middle = Math.floor(sortedDays.length / 2);
  return sortedDays.length % 2 === 1
    ? sortedDays[middle]
    : (sortedDays[middle - 1] + sortedDays[middle]) / 2;
}

/**
 * Ids of entries whose date is more than 7 days from the rest of the upload (OCR-8). The reference
 * is the median date, or the nearest other date for uploads with fewer than 3 dated entries; a
 * lone dated entry has nothing to compare with and is never flagged. Entries without a real date
 * are ignored here because they are already flagged as missing. Pure and cheap, so callers
 * recompute it on every edit and nothing about it is stored.
 */
export function findDateOutliers(entries: readonly DatedEntry[]): Set<number> {
  const dated = entries.flatMap((entry) => {
    const day = toDayNumber(entry.date);
    return day === null ? [] : [{ id: entry.id, day }];
  });

  if (dated.length < 2) return new Set();

  if (dated.length < MIN_ENTRIES_FOR_MEDIAN) {
    const [first, second] = dated;
    return Math.abs(first.day - second.day) > OUTLIER_DAYS
      ? new Set([first.id, second.id])
      : new Set();
  }

  const reference = median(dated.map((item) => item.day).sort((a, b) => a - b));
  return new Set(
    dated.filter((item) => Math.abs(item.day - reference) > OUTLIER_DAYS).map((item) => item.id)
  );
}
