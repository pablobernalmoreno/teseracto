import { buildReadPasses, type PageMode } from "./readPasses";
import { readReceipt } from "./readReceipt";

// The "image" is a label; recognising it returns the text scripted for that label and mode.
function setup(texts: Record<string, string>) {
  const recognize = jest.fn(
    async (image: string, mode: PageMode) => texts[`${image}:${mode}`] ?? ""
  );
  const treatments = ["contrast", "inverted"].map((label) => jest.fn(async () => label));
  return { recognize, treatments };
}

describe("buildReadPasses", () => {
  it("tries every mode on the image as it is, then each treated version in two modes", async () => {
    const { recognize, treatments } = setup({});

    await readReceipt(buildReadPasses("raw", recognize, treatments));

    expect(recognize.mock.calls).toEqual([
      ["raw", "block"],
      ["raw", "auto"],
      ["raw", "sparse"],
      ["contrast", "block"],
      ["contrast", "auto"],
      ["inverted", "block"],
      ["inverted", "auto"],
    ]);
  });

  it("does not build a treated version when the image-only passes are enough", async () => {
    const { recognize, treatments } = setup({
      "raw:block": "23 sept 2026",
      "raw:auto": "Valor del pago $ 15.000",
    });

    const result = await readReceipt(buildReadPasses("raw", recognize, treatments));

    expect(result).toEqual({ date: "23/09/2026", money: "15.000", passesRun: 2 });
    expect(treatments[0]).not.toHaveBeenCalled();
    expect(treatments[1]).not.toHaveBeenCalled();
  });

  it("finds a big amount with auto mode when block mode drops it", async () => {
    const { recognize, treatments } = setup({
      "raw:block": "24 sept 2026 - 8:08 p.m.\nValor del pago\nCosto del pago $ 0,00",
      "raw:auto": "Valor del pago\n$ 51.600\nCosto del pago $ 0,00",
    });

    const result = await readReceipt(buildReadPasses("raw", recognize, treatments));

    expect(result).toEqual({ date: "24/09/2026", money: "51.600", passesRun: 2 });
  });

  it("finds the amount of a dark-mode screenshot on the inverted version", async () => {
    const { recognize, treatments } = setup({
      "raw:block": "24 sept 2026 - 8:08 p.m.",
      "inverted:auto": "Valor del pago $ 41.500",
    });

    const result = await readReceipt(buildReadPasses("raw", recognize, treatments));

    expect(result).toMatchObject({ date: "24/09/2026", money: "41.500" });
  });

  it("builds each treated version once even though two modes read it", async () => {
    const { recognize, treatments } = setup({});

    await readReceipt(buildReadPasses("raw", recognize, treatments));

    expect(treatments[0]).toHaveBeenCalledTimes(1);
    expect(treatments[1]).toHaveBeenCalledTimes(1);
  });

  it("falls back to the later passes when a treatment cannot be built", async () => {
    const { recognize, treatments } = setup({ "inverted:block": "25 sept 2026" });
    treatments[0].mockRejectedValue(new Error("decode failed"));
    jest.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await readReceipt(buildReadPasses("raw", recognize, treatments));

    expect(result.date).toBe("25/09/2026");
    jest.restoreAllMocks();
  });

  it("has only the image-only passes when there are no treatments", async () => {
    const { recognize } = setup({});

    await readReceipt(buildReadPasses("raw", recognize, []));

    expect(recognize).toHaveBeenCalledTimes(3);
  });
});
