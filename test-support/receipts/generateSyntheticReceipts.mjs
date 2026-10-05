// Generates synthetic payment-receipt screenshots for the Cypress component tests and the OCR
// accuracy suite. Everything on them is fake (a made-up shop and receipt numbers), so the output
// can be committed. The layout imitates the labels the real receipts use ("Valor del pago",
// "Comprobante No.", "23 sept 2026 - 3:35 p.m.").
//
//   pnpm fixtures:receipts
//
// Output is deterministic: no randomness, and file names follow the `dd-mm-yyyy-amount` convention
// (optional `-N` suffix) that test-support/receipts/expectedFromFilename.ts understands.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";

const OUTPUT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../cypress/fixtures/receipts"
);

const WIDTH = 900;
const HEIGHT = 1600;
const FONT = "sans-serif";

// `file` is the expected-values file name; the receipt text is what is drawn on the image.
const RECEIPTS = [
  {
    file: "23-09-2026-15.000.png",
    date: "23 sept 2026",
    time: "3:35 p.m.",
    amount: "15.000",
    no: "TRX0000001",
  },
  {
    file: "24-09-2026-51.600.png",
    date: "24 sept 2026",
    time: "8:08 p.m.",
    amount: "51.600",
    no: "TRX0000002",
  },
  {
    file: "25-09-2026-65.800.png",
    date: "25 sept 2026",
    time: "6:39 p.m.",
    amount: "65.800",
    no: "TRX0000003",
  },
  // Same date and same amount on two different receipts: both must be kept.
  {
    file: "23-09-2026-27.700.png",
    date: "23 sept 2026",
    time: "1:03 p.m.",
    amount: "27.700",
    no: "TRX0000004",
  },
  {
    file: "23-09-2026-27.700-2.png",
    date: "23 sept 2026",
    time: "6:31 p.m.",
    amount: "27.700",
    no: "TRX0000005",
  },
];

function drawText(context, text, y, { size = 34, weight = "normal", color = "#222222" } = {}) {
  context.font = `${weight} ${size}px ${FONT}`;
  context.fillStyle = color;
  context.textAlign = "center";
  context.fillText(text, WIDTH / 2, y);
}

function drawRow(context, label, value, y) {
  context.font = `normal 32px ${FONT}`;
  context.fillStyle = "#222222";
  context.textAlign = "left";
  context.fillText(label, 80, y);
  context.textAlign = "right";
  context.fillText(value, WIDTH - 80, y);
}

function renderReceipt({ date, time, amount, no }) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const context = canvas.getContext("2d");

  context.fillStyle = "#f2f2f5";
  context.fillRect(0, 0, WIDTH, HEIGHT);

  drawText(context, "¡Pago exitoso!", 190, { size: 58, weight: "bold" });
  drawText(context, `Comprobante No. ${no}`, 270);
  drawText(context, `${date} - ${time}`, 325);

  context.strokeStyle = "#999999";
  context.setLineDash([14, 12]);
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(80, 390);
  context.lineTo(WIDTH - 80, 390);
  context.stroke();

  drawText(context, "Valor del pago", 470);
  drawText(context, `$ ${amount}`, 560, { size: 76, weight: "bold" });
  drawText(context, "Costo del pago", 650, { size: 30 });
  drawText(context, "$ 0,00", 700, { size: 34, weight: "bold" });

  context.beginPath();
  context.moveTo(80, 770);
  context.lineTo(WIDTH - 80, 770);
  context.stroke();

  drawText(context, "¿A quién le llegó la plata?", 850, { size: 38, weight: "bold" });
  drawRow(context, "Punto de venta", "COMERCIO DEMO", 940);
  drawRow(context, "Código de negocio", "0000000000", 1010);

  return canvas.toBuffer("image/png");
}

// A white image with no text: the reader finds nothing, which deterministically exercises the
// manual-entry path.
function renderBlank() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, WIDTH, HEIGHT);
  return canvas.toBuffer("image/png");
}

mkdirSync(OUTPUT_DIR, { recursive: true });

for (const receipt of RECEIPTS) {
  writeFileSync(path.join(OUTPUT_DIR, receipt.file), renderReceipt(receipt));
}
writeFileSync(path.join(OUTPUT_DIR, "blank.png"), renderBlank());

process.stdout.write(`Wrote ${RECEIPTS.length + 1} images to ${OUTPUT_DIR}\n`);
