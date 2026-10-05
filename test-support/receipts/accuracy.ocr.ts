// OCR accuracy suite: runs the production read pipeline (Spanish model, several page-reading modes,
// treated images) over receipt images and compares the result with the expected values in each
// file name. It is real OCR, so it is slow and needs network on the first run (the language data is
// downloaded, then cached under node_modules/.cache), which is why it lives in a `*.ocr.ts` file
// that only `pnpm test:ocr` runs and not in the default `pnpm test` gate.
//
//   pnpm test:ocr                                  synthetic receipts only
//   RECEIPT_SAMPLES_DIR=<folder> pnpm test:ocr     also the real samples (never committed)
//   RECEIPT_OCR_LANGS=eng pnpm test:ocr            compare another model (default "spa")
//
// The real samples contain names and account numbers, so they stay out of git; without the
// variable that half of the suite is skipped.
import fs from "node:fs";
import path from "node:path";
import { createWorker, PSM } from "tesseract.js";
import { createTreatments } from "../../src/lib/receipts/imageTreatments";
import { buildReadPasses, type PageMode } from "../../src/lib/receipts/readPasses";
import { readReceipt, type ReceiptRead } from "../../src/lib/receipts/readReceipt";
import { expectedFromFilename } from "./expectedFromFilename";
import { nodeCodec } from "./nodeCodec";

const LANGS = process.env.RECEIPT_OCR_LANGS ?? "spa";
const REAL_DIR = process.env.RECEIPT_SAMPLES_DIR;
const SYNTHETIC_DIR = path.resolve(__dirname, "../../cypress/fixtures/receipts");
const CACHE_DIR = path.resolve(__dirname, "../../node_modules/.cache/tesseract");
const IMAGE_FILE = /\.(jpe?g|png|webp)$/i;

// Minimum share of the real samples that must be read correctly. Measured on the 24 samples with
// the Spanish model: 18 dates (0.75) and 22 amounts (0.92); the English model read 19 and 22. The
// floors sit a little below that so a small engine change does not fail the suite, and are raised
// as the reader improves (see design.md in the change).
const MIN_REAL_DATES = Number(process.env.RECEIPT_MIN_DATES ?? 0.7);
const MIN_REAL_MONEY = Number(process.env.RECEIPT_MIN_MONEY ?? 0.85);

// The same mapping the app uses in useItemCardModel.ts.
const SEGMENTATION: Record<PageMode, PSM> = {
  block: PSM.SINGLE_BLOCK,
  auto: PSM.AUTO,
  sparse: PSM.SPARSE_TEXT,
};

type Worker = Awaited<ReturnType<typeof createWorker>>;
let workerPromise: Promise<Worker> | undefined;
const getWorker = () => (workerPromise ??= createWorker(LANGS, 1, { cachePath: CACHE_DIR }));

afterAll(async () => {
  if (workerPromise) await (await workerPromise).terminate();
});

interface Measured {
  name: string;
  expected: { date: string | null; money: string };
  firstPass: ReceiptRead;
  withRetry: ReceiptRead;
}

async function measureFolder(dir: string): Promise<Measured[]> {
  const worker = await getWorker();
  // Raw-image recognitions are cached so the first-pass baseline and the full run share them.
  const cache = new Map<string, string>();
  const recognize = async (image: string | Buffer, mode: PageMode) => {
    const key = typeof image === "string" ? `${image}:${mode}` : null;
    if (key && cache.has(key)) return cache.get(key)!;

    await worker.setParameters({ tessedit_pageseg_mode: SEGMENTATION[mode] });
    const text = (await worker.recognize(image)).data.text;
    if (key) cache.set(key, text);
    return text;
  };

  const results: Measured[] = [];
  for (const name of fs
    .readdirSync(dir)
    .filter((file) => IMAGE_FILE.test(file))
    .sort()) {
    const oracle = expectedFromFilename(name);
    // A file without the naming convention is a blank on purpose: nothing should be read.
    const expected = oracle ?? { date: null, money: "" };
    const file = path.join(dir, name);

    const passes = buildReadPasses(file, recognize, createTreatments(file, nodeCodec));
    const firstPass = await readReceipt(passes.slice(0, 1));
    const withRetry = await readReceipt(passes);
    results.push({ name, expected, firstPass, withRetry });
  }
  return results;
}

const isDateRight = (read: ReceiptRead, expected: Measured["expected"]) =>
  read.date === expected.date;
const isMoneyRight = (read: ReceiptRead, expected: Measured["expected"]) =>
  read.money === expected.money;

function report(label: string, results: Measured[]) {
  const count = (pick: (m: Measured) => ReceiptRead, right: typeof isDateRight) =>
    results.filter((m) => right(pick(m), m.expected)).length;
  const passes = results.reduce((sum, m) => sum + m.withRetry.passesRun, 0);
  const lines = [
    `\n[${label}] model=${LANGS} images=${results.length}`,
    `  dates  first pass ${count((m) => m.firstPass, isDateRight)}/${results.length}  with retry ${count((m) => m.withRetry, isDateRight)}/${results.length}`,
    `  money  first pass ${count((m) => m.firstPass, isMoneyRight)}/${results.length}  with retry ${count((m) => m.withRetry, isMoneyRight)}/${results.length}`,
    `  passes ${passes} in total, ${(passes / results.length).toFixed(1)} per image (max ${Math.max(...results.map((m) => m.withRetry.passesRun))})`,
  ];
  for (const m of results) {
    const dateMiss = !isDateRight(m.withRetry, m.expected);
    const moneyMiss = !isMoneyRight(m.withRetry, m.expected);
    if (dateMiss || moneyMiss) {
      lines.push(
        `  miss ${m.name}: ${dateMiss ? `date ${m.withRetry.date ?? "-"} (want ${m.expected.date ?? "-"}) ` : ""}${moneyMiss ? `money ${m.withRetry.money || "-"} (want ${m.expected.money || "-"})` : ""}`
      );
    }
  }
  process.stdout.write(lines.join("\n") + "\n");
}

describe("OCR accuracy on synthetic receipts", () => {
  let results: Measured[] = [];

  beforeAll(async () => {
    results = await measureFolder(SYNTHETIC_DIR);
    report("synthetic", results);
  });

  it("finds the synthetic images", () => {
    expect(results.length).toBeGreaterThanOrEqual(6);
  });

  it("reads every synthetic receipt's date and amount exactly", () => {
    const wrong = results
      .filter(
        (m) => !isDateRight(m.withRetry, m.expected) || !isMoneyRight(m.withRetry, m.expected)
      )
      .map((m) => m.name);
    expect(wrong).toEqual([]);
  });

  it("reads nothing from the blank image, so it goes to manual entry", () => {
    const blank = results.find((m) => m.name === "blank.png");
    expect(blank?.withRetry).toMatchObject({ date: null, money: "" });
  });

  it("never reads worse with the retry than with the first pass alone", () => {
    for (const m of results) {
      if (isDateRight(m.firstPass, m.expected)) expect(m.withRetry.date).toBe(m.firstPass.date);
      if (isMoneyRight(m.firstPass, m.expected)) expect(m.withRetry.money).toBe(m.firstPass.money);
    }
  });
});

(REAL_DIR ? describe : describe.skip)(
  "OCR accuracy on the real samples (RECEIPT_SAMPLES_DIR)",
  () => {
    let results: Measured[] = [];

    beforeAll(async () => {
      results = await measureFolder(REAL_DIR as string);
      report("real", results);
    });

    it("reads at least the minimum share of dates", () => {
      const right = results.filter((m) => isDateRight(m.withRetry, m.expected)).length;
      expect(right / results.length).toBeGreaterThanOrEqual(MIN_REAL_DATES);
    });

    it("reads at least the minimum share of amounts", () => {
      const right = results.filter((m) => isMoneyRight(m.withRetry, m.expected)).length;
      expect(right / results.length).toBeGreaterThanOrEqual(MIN_REAL_MONEY);
    });

    it("never reads a date or amount wrong that the first pass read right", () => {
      for (const m of results) {
        if (isDateRight(m.firstPass, m.expected)) expect(m.withRetry.date).toBe(m.firstPass.date);
        if (isMoneyRight(m.firstPass, m.expected))
          expect(m.withRetry.money).toBe(m.firstPass.money);
      }
    });
  }
);
