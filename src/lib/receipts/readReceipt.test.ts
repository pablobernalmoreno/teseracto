import { readReceipt, type ReadPass } from "./readReceipt";

// Each pass is scripted to return text, or to throw.
function passes(...scripts: (string | Error)[]): jest.Mock<Promise<string>>[] {
  return scripts.map((script) =>
    jest.fn(async () => {
      if (script instanceof Error) throw script;
      return script;
    })
  );
}

const run = (list: jest.Mock<Promise<string>>[]) => readReceipt(list as ReadPass[]);

describe("readReceipt", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("runs only the first pass when it finds both fields", async () => {
    const list = passes(
      "23 sept 2026 - 3:35 p.m.\nValor del pago $ 15.000",
      "no se lee",
      "no se lee"
    );

    const result = await run(list);

    expect(result).toEqual({ date: "23/09/2026", money: "15.000", passesRun: 1 });
    expect(list[1]).not.toHaveBeenCalled();
    expect(list[2]).not.toHaveBeenCalled();
  });

  it("fills the date from the second pass and the amount from the third", async () => {
    const list = passes(
      "ruido",
      "24 sept 2026 - 8:08 p.m.",
      "Valor del pago $ 41.500",
      "no se lee"
    );

    const result = await run(list);

    expect(result).toEqual({ date: "24/09/2026", money: "41.500", passesRun: 3 });
    expect(list[3]).not.toHaveBeenCalled();
  });

  it("stops as soon as both fields are found", async () => {
    const list = passes("ruido", "24 sept 2026\nValor del pago $ 41.500", "no deberia leerse");

    const result = await run(list);

    expect(result).toEqual({ date: "24/09/2026", money: "41.500", passesRun: 2 });
    expect(list[2]).not.toHaveBeenCalled();
  });

  it("never overwrites a field an earlier pass already found", async () => {
    const list = passes("23 sept 2026", "25 sept 2026\nValor del pago $ 51.600");

    const result = await run(list);

    expect(result).toEqual({ date: "23/09/2026", money: "51.600", passesRun: 2 });
  });

  it("returns what it has when every pass finds nothing", async () => {
    const list = passes("ruido", "mas ruido", "");

    const result = await run(list);

    expect(result).toEqual({ date: null, money: "", passesRun: 3 });
  });

  it("skips a pass that throws and carries on with the next ones", async () => {
    const list = passes("23 sept 2026", new Error("decode failed"), "Valor del pago $ 15.000");

    const result = await run(list);

    expect(result).toEqual({ date: "23/09/2026", money: "15.000", passesRun: 3 });
  });

  it("keeps the first-pass result when every later pass throws", async () => {
    const list = passes("Valor del pago $ 15.000", new Error("a"), new Error("b"));

    const result = await run(list);

    expect(result).toEqual({ date: null, money: "15.000", passesRun: 3 });
  });

  it("lets a first-pass failure through so the caller can treat it as a worker failure", async () => {
    const list = passes(new Error("worker failed"), "23 sept 2026");

    await expect(run(list)).rejects.toThrow("worker failed");
    expect(list[1]).not.toHaveBeenCalled();
  });

  it("returns an empty read when there are no passes", async () => {
    expect(await readReceipt([])).toEqual({ date: null, money: "", passesRun: 0 });
  });
});
