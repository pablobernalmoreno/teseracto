import { expectedFromFilename } from "./expectedFromFilename";

describe("expectedFromFilename", () => {
  it("reads the date and amount from the file name", () => {
    expect(expectedFromFilename("24-09-2026-51.600.jpeg")).toEqual({
      date: "24/09/2026",
      money: "51.600",
    });
  });

  it("ignores the -N suffix used for repeated date and amount", () => {
    expect(expectedFromFilename("23-09-2026-27.700-2.jpeg")).toEqual({
      date: "23/09/2026",
      money: "27.700",
    });
    expect(expectedFromFilename("23-09-2026-27.700.jpeg")).toEqual({
      date: "23/09/2026",
      money: "27.700",
    });
  });

  it("returns null for a name that does not follow the convention", () => {
    expect(expectedFromFilename("IMG-20260923-WA0001.jpg")).toBeNull();
    expect(expectedFromFilename("23-09-26-15.000.jpeg")).toBeNull();
    expect(expectedFromFilename("receipt.jpeg")).toBeNull();
  });
});
