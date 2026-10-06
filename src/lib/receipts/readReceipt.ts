import { extractAmount } from "./amounts";
import { extractDate } from "./dates";

export interface ReceiptRead {
  date: string | null;
  money: string;
  // How many OCR passes ran for this image (1 when the first read found both fields).
  passesRun: number;
}

// One way of reading the image (a page-reading mode, optionally on a treated image), producing text.
export type ReadPass = () => Promise<string>;

/**
 * Reads one receipt image (OCR-9) by running passes in order. The first pass always runs. While the
 * date or the amount is still missing, the next pass runs and fills only the missing fields; a
 * field that was already found is never overwritten. Images that read fine on the first pass never
 * run another.
 *
 * Fails open per image: if a later pass throws, it is skipped and the next one runs, and what was
 * found is returned, so the image falls to manual entry (OCR-5, OCR-6) instead of failing the whole
 * upload. A throw from the first pass is not caught: the caller treats that as a worker failure
 * for the whole upload (OCR-6).
 */
export async function readReceipt(passes: readonly ReadPass[]): Promise<ReceiptRead> {
  const [firstPass, ...retries] = passes;
  if (!firstPass) return { date: null, money: "", passesRun: 0 };

  const firstText = await firstPass();
  let date = extractDate(firstText);
  let money = extractAmount(firstText);
  let passesRun = 1;

  for (const pass of retries) {
    if (date && money) break;

    passesRun += 1;
    try {
      const text = await pass();
      date = date ?? extractDate(text);
      money = money || extractAmount(text);
    } catch (error) {
      console.warn("OCR pass failed, trying the next one", error);
    }
  }

  return { date, money, passesRun };
}
