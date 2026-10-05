import type { ImageCodec, PixelImage } from "./imageTreatments";

// Browser side of the image treatments: decodes a selected file into pixels and encodes treated
// pixels as a PNG blob the OCR worker can read. Everything stays in the browser (OCR-1).
export const browserCodec: ImageCodec<Blob, Blob> = {
  async decode(file) {
    const bitmap = await createImageBitmap(file);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas 2D context is not available");

      context.drawImage(bitmap, 0, 0);
      const { data, width, height } = context.getImageData(0, 0, bitmap.width, bitmap.height);
      return { data, width, height } satisfies PixelImage;
    } finally {
      bitmap.close();
    }
  },

  async encode(image) {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context is not available");

    context.putImageData(
      new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
      0,
      0
    );

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the treated image"))),
        "image/png"
      );
    });
  },
};
