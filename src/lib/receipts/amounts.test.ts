import { extractAmount, extractAmounts } from "./amounts";

describe("extractAmount", () => {
  it("reads the thousands separator and ignores small numbers", () => {
    expect(extractAmount("Total 12.500 y 300")).toBe("12.500");
  });

  it("falls back to the largest plausible number when there is no label", () => {
    expect(extractAmount("$15.000 he\n$ 0,00\n$ 8.200")).toBe("15.000");
  });

  it("reads decimals in Colombian format", () => {
    expect(extractAmount("Total 1.234,50")).toBe("1.234,5");
  });

  it("prefers the labelled value over a larger number", () => {
    const text = "Valor del pago\n$ 21.500\nCosto del pago\n$ 0,00\nSaldo 1.250.000";
    expect(extractAmount(text)).toBe("21.500");
  });

  it("prefers the labelled value over a business code", () => {
    const text = "Código de negocio 009288065\nValor del pago $ 21.500";
    expect(extractAmount(text)).toBe("21.500");
  });

  it("reads the transfer label with the amount on the same or the next line", () => {
    expect(extractAmount("Valor de la transferencia\n$108.400\nCosto $ 0,00")).toBe("108.400");
    expect(extractAmount("Valor de la transferencia $ 360.000")).toBe("360.000");
  });

  it("reads a labelled amount written without separators", () => {
    expect(extractAmount("Valor del pago $ 21500")).toBe("21.500");
  });

  it("does not take the cost line when the labelled amount line was not read", () => {
    expect(extractAmount("Valor del pago 3\nCosto del pago\n$ 0,00")).toBe("");
  });

  it("ignores amounts below 1.000", () => {
    expect(extractAmount("$ 0,00 y $ 500")).toBe("");
    expect(extractAmount("Valor del pago $ 500")).toBe("");
  });

  it("ignores long digit strings such as business codes and account numbers", () => {
    expect(extractAmount("Código de negocio 0092880655")).toBe("");
    expect(extractAmount("Comprobante No. 0000008900")).toBe("");
  });

  it("returns an empty string when there is nothing to read", () => {
    expect(extractAmount("")).toBe("");
    expect(extractAmount("sin valores")).toBe("");
  });

  it("keeps one result per image, in order", () => {
    expect(extractAmounts(["$ 15.000", "nada", "Valor del pago $ 74.898"])).toEqual([
      "15.000",
      "",
      "74.898",
    ]);
  });
});
