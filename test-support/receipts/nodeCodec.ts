import { createCanvas, loadImage } from "@napi-rs/canvas";
import type { ImageCodec, PixelImage } from "../../src/lib/receipts/imageTreatments";

// Node side of the image treatments, backed by @napi-rs/canvas. Input is a file path or a Buffer;
// output is a PNG Buffer, which tesseract.js accepts in Node. Lets the accuracy suite run the same
// production treatments the browser runs.
export const nodeCodec: ImageCodec<string | Buffer, Buffer> = {
  async decode(input) {
    const image = await loadImage(input);
    const canvas = createCanvas(image.width, image.height);
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    const { data, width, height } = context.getImageData(0, 0, image.width, image.height);
    return { data: new Uint8ClampedArray(data), width, height } satisfies PixelImage;
  },

  async encode(image) {
    const canvas = createCanvas(image.width, image.height);
    const context = canvas.getContext("2d");
    const imageData = context.createImageData(image.width, image.height);
    imageData.data.set(image.data);
    context.putImageData(imageData, 0, 0);
    return canvas.toBuffer("image/png");
  },
};
