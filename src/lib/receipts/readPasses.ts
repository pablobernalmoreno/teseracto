import type { ReadPass } from "./readReceipt";

// How the OCR engine reads the page. Block is the engine's own default and reads dates best, but it
// drops large bold text such as the amount on many receipts; auto and sparse find that text. Measured
// on real Bre-B and Nequi receipts, they complement each other, so the reader tries them in turn.
export type PageMode = "block" | "auto" | "sparse";

export type ModeRecognize<Image> = (image: Image, mode: PageMode) => Promise<string>;

// The modes tried on the image as it is, in order, then on each treated version.
const RAW_MODES: readonly PageMode[] = ["block", "auto", "sparse"];
const TREATED_MODES: readonly PageMode[] = ["block", "auto"];

function once<T>(make: () => Promise<T>): () => Promise<T> {
  let result: Promise<T> | undefined;
  return () => (result ??= make());
}

/**
 * The ordered passes for one image: every mode on the image as it is first, because that costs no
 * image work, then the treated versions (built lazily and only once each) in the cheaper modes.
 * `readReceipt` stops as soon as both fields are found, so a clean image runs only the first.
 */
export function buildReadPasses<Input, Treated>(
  input: Input,
  recognize: ModeRecognize<Input | Treated>,
  treatments: readonly (() => Promise<Treated>)[]
): ReadPass[] {
  const rawPasses = RAW_MODES.map(
    (mode): ReadPass =>
      () =>
        recognize(input, mode)
  );

  const treatedPasses = treatments.flatMap((treatment) => {
    const treated = once(treatment);
    return TREATED_MODES.map(
      (mode): ReadPass =>
        async () =>
          recognize(await treated(), mode)
    );
  });

  return [...rawPasses, ...treatedPasses];
}
