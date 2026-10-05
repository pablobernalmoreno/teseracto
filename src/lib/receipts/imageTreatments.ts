// Image treatments used to re-read receipts the first pass could not (OCR-9). The pixel work is
// pure so it behaves the same in the browser and in Node; only decoding a file into pixels and
// encoding pixels back for the OCR worker depend on the environment, through `ImageCodec`.

// RGBA, 4 bytes per pixel, row by row (the layout of canvas `ImageData`).
export interface PixelImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface ImageCodec<Input, Output> {
  decode(input: Input): Promise<PixelImage>;
  encode(image: PixelImage): Promise<Output>;
}

// Upscale small screenshots so the text is large enough for the OCR engine, but never past this
// many pixels on the long side: a 12-megapixel phone photo doubled would need hundreds of MB.
const MAX_SIDE = 3200;
const MAX_FACTOR = 2;

export function scaleFactorFor(width: number, height: number): number {
  const longSide = Math.max(width, height);
  if (longSide <= 0) return 1;
  return Math.min(MAX_FACTOR, Math.max(1, MAX_SIDE / longSide));
}

export function grayscale(image: PixelImage): PixelImage {
  const data = new Uint8ClampedArray(image.data.length);
  for (let i = 0; i < image.data.length; i += 4) {
    const luminance = 0.299 * image.data[i] + 0.587 * image.data[i + 1] + 0.114 * image.data[i + 2];
    data[i] = luminance;
    data[i + 1] = luminance;
    data[i + 2] = luminance;
    data[i + 3] = image.data[i + 3];
  }
  return { data, width: image.width, height: image.height };
}

// Stretches the 1st to 99th percentile of a grayscale image to the full range, so washed-out
// photos and dim screens get usable contrast. A flat image is returned unchanged (as a copy).
export function stretchContrast(image: PixelImage): PixelImage {
  const histogram = new Array<number>(256).fill(0);
  for (let i = 0; i < image.data.length; i += 4) histogram[image.data[i]] += 1;

  const pixels = image.data.length / 4;
  const percentile = (share: number) => {
    let seen = 0;
    for (let value = 0; value < 256; value += 1) {
      seen += histogram[value];
      if (seen >= pixels * share) return value;
    }
    return 255;
  };

  const low = percentile(0.01);
  const high = percentile(0.99);
  const data = new Uint8ClampedArray(image.data);
  if (high <= low) return { data, width: image.width, height: image.height };

  const scale = 255 / (high - low);
  for (let i = 0; i < data.length; i += 4) {
    const value = (data[i] - low) * scale;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }
  return { data, width: image.width, height: image.height };
}

// Light text on a dark background (dark-mode screens) reads better as dark text on light.
export function invert(image: PixelImage): PixelImage {
  const data = new Uint8ClampedArray(image.data);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  return { data, width: image.width, height: image.height };
}

export function resizeBilinear(image: PixelImage, factor: number): PixelImage {
  const width = Math.max(1, Math.round(image.width * factor));
  const height = Math.max(1, Math.round(image.height * factor));
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.min(Math.max((y + 0.5) / factor - 0.5, 0), image.height - 1);
    const y0 = Math.floor(sourceY);
    const y1 = Math.min(y0 + 1, image.height - 1);
    const fy = sourceY - y0;

    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(Math.max((x + 0.5) / factor - 0.5, 0), image.width - 1);
      const x0 = Math.floor(sourceX);
      const x1 = Math.min(x0 + 1, image.width - 1);
      const fx = sourceX - x0;

      const out = (y * width + x) * 4;
      for (let channel = 0; channel < 4; channel += 1) {
        const top =
          image.data[(y0 * image.width + x0) * 4 + channel] * (1 - fx) +
          image.data[(y0 * image.width + x1) * 4 + channel] * fx;
        const bottom =
          image.data[(y1 * image.width + x0) * 4 + channel] * (1 - fx) +
          image.data[(y1 * image.width + x1) * 4 + channel] * fx;
        data[out + channel] = top * (1 - fy) + bottom * fy;
      }
    }
  }

  return { data, width, height };
}

// Order matters: the retry stops as soon as the missing fields are filled.
const TREATMENTS: readonly ((image: PixelImage) => PixelImage)[] = [
  (image) =>
    stretchContrast(grayscale(resizeBilinear(image, scaleFactorFor(image.width, image.height)))),
  (image) =>
    invert(
      stretchContrast(grayscale(resizeBilinear(image, scaleFactorFor(image.width, image.height))))
    ),
];

export const TREATMENT_COUNT = TREATMENTS.length;

/**
 * Lazy treated versions of one image: nothing is decoded until the first one is requested, the
 * decode is shared, and each version is only built when asked for (images that read fine on the
 * first pass never pay for any of this).
 */
export function createTreatments<Input, Output>(
  input: Input,
  codec: ImageCodec<Input, Output>
): (() => Promise<Output>)[] {
  let decoded: Promise<PixelImage> | undefined;
  const decodeOnce = () => (decoded ??= codec.decode(input));

  return TREATMENTS.map((treat) => async () => codec.encode(treat(await decodeOnce())));
}
