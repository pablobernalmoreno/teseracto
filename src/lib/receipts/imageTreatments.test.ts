import { createCanvas, loadImage } from "@napi-rs/canvas";
import { nodeCodec } from "../../../test-support/receipts/nodeCodec";
import {
  createTreatments,
  grayscale,
  invert,
  resizeBilinear,
  scaleFactorFor,
  stretchContrast,
  TREATMENT_COUNT,
  type PixelImage,
} from "./imageTreatments";

function pixelImage(width: number, height: number, rgba: [number, number, number, number]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) data.set(rgba, i);
  return { data, width, height } satisfies PixelImage;
}

// A PNG with a light background and a dark block, like dark text on a receipt.
function receiptPng(width: number, height: number): Buffer {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.fillStyle = "#e6e6e6";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#202020";
  context.fillRect(0, 0, Math.floor(width / 2), height);
  return canvas.toBuffer("image/png");
}

async function decodedPixel(png: Buffer, x: number, y: number) {
  const image = await loadImage(png);
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  return {
    width: image.width,
    height: image.height,
    pixel: [...context.getImageData(x, y, 1, 1).data],
  };
}

describe("scaleFactorFor", () => {
  it("doubles typical screenshots", () => {
    expect(scaleFactorFor(899, 1599)).toBe(2);
  });

  it("caps the output at 3200 pixels on the long side", () => {
    expect(scaleFactorFor(2000, 1000)).toBe(1.6);
  });

  it("never shrinks and does not upscale large photos", () => {
    expect(scaleFactorFor(4000, 3000)).toBe(1);
    expect(scaleFactorFor(3200, 100)).toBe(1);
  });

  it("falls back to 1 for an empty image", () => {
    expect(scaleFactorFor(0, 0)).toBe(1);
  });
});

describe("pixel operations", () => {
  it("invert flips a known pixel and keeps alpha", () => {
    const result = invert(pixelImage(1, 1, [200, 100, 0, 255]));
    expect([...result.data]).toEqual([55, 155, 255, 255]);
  });

  it("grayscale gives equal channels from the luminance and keeps alpha", () => {
    const result = grayscale(pixelImage(1, 1, [255, 0, 0, 128]));
    expect([...result.data]).toEqual([76, 76, 76, 128]);
  });

  it("stretchContrast spreads a narrow range to the full range", () => {
    const data = new Uint8ClampedArray(100 * 4);
    for (let pixel = 0; pixel < 100; pixel += 1) {
      const value = pixel < 50 ? 100 : 140;
      data.set([value, value, value, 255], pixel * 4);
    }
    const result = stretchContrast({ data, width: 10, height: 10 });

    expect(result.data[0]).toBe(0);
    expect(result.data[99 * 4]).toBe(255);
  });

  it("stretchContrast leaves a flat image as it is", () => {
    const result = stretchContrast(pixelImage(4, 4, [90, 90, 90, 255]));
    expect([...result.data.slice(0, 4)]).toEqual([90, 90, 90, 255]);
  });

  it("resizeBilinear scales the dimensions and keeps a flat colour", () => {
    const result = resizeBilinear(pixelImage(3, 2, [10, 20, 30, 255]), 2);

    expect(result.width).toBe(6);
    expect(result.height).toBe(4);
    expect([...result.data.slice(0, 4)]).toEqual([10, 20, 30, 255]);
    expect([...result.data.slice(-4)]).toEqual([10, 20, 30, 255]);
  });

  it.each([
    ["grayscale", grayscale],
    ["invert", invert],
    ["stretchContrast", stretchContrast],
    ["resizeBilinear", (image: PixelImage) => resizeBilinear(image, 2)],
  ])("%s does not mutate its input", (_name, operation) => {
    const input = pixelImage(2, 2, [200, 100, 50, 255]);
    const snapshot = [...input.data];

    operation(input);

    expect([...input.data]).toEqual(snapshot);
  });
});

describe("createTreatments", () => {
  it("produces upscaled versions of the image", async () => {
    const treatments = createTreatments(receiptPng(20, 40), nodeCodec);
    expect(treatments).toHaveLength(TREATMENT_COUNT);

    const first = await decodedPixel(await treatments[0](), 0, 0);
    expect(first.width).toBe(40);
    expect(first.height).toBe(80);
  });

  it("gives dark-on-light first and the inverse as the second version", async () => {
    const treatments = createTreatments(receiptPng(20, 40), nodeCodec);

    // Pixel (5, 5) is inside the dark block, pixel (35, 5) in the light background.
    const first = [
      await decodedPixel(await treatments[0](), 5, 5),
      await decodedPixel(await treatments[0](), 35, 5),
    ];
    const second = [
      await decodedPixel(await treatments[1](), 5, 5),
      await decodedPixel(await treatments[1](), 35, 5),
    ];

    expect(first[0].pixel[0]).toBeLessThan(first[1].pixel[0]);
    expect(second[0].pixel[0]).toBeGreaterThan(second[1].pixel[0]);
  });

  it("does not decode until a version is requested, and decodes once", async () => {
    const decode = jest.spyOn(nodeCodec, "decode");
    const treatments = createTreatments(receiptPng(10, 10), nodeCodec);
    expect(decode).not.toHaveBeenCalled();

    await treatments[0]();
    await treatments[1]();
    expect(decode).toHaveBeenCalledTimes(1);
    decode.mockRestore();
  });

  it("does not change the input buffer", async () => {
    const png = receiptPng(10, 10);
    const snapshot = Buffer.from(png);

    await createTreatments(png, nodeCodec)[0]();

    expect(png.equals(snapshot)).toBe(true);
  });
});
