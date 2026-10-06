import { parseIsoDate } from "./validation";

describe("parseIsoDate", () => {
  it("accepts a real YYYY-MM-DD date and trims it", () => {
    expect(parseIsoDate("2026-09-23")).toBe("2026-09-23");
    expect(parseIsoDate("  2026-09-23  ")).toBe("2026-09-23");
    expect(parseIsoDate("2028-02-29")).toBe("2028-02-29");
  });

  it("rejects impossible days and months", () => {
    expect(parseIsoDate("2026-02-31")).toBeNull();
    expect(parseIsoDate("2027-02-29")).toBeNull();
    expect(parseIsoDate("2026-13-01")).toBeNull();
    expect(parseIsoDate("2026-00-10")).toBeNull();
  });

  it("rejects other formats and non-strings", () => {
    expect(parseIsoDate("23/09/2026")).toBeNull();
    expect(parseIsoDate("2026-09-23T00:00:00Z")).toBeNull();
    expect(parseIsoDate("")).toBeNull();
    expect(parseIsoDate(20260923)).toBeNull();
    expect(parseIsoDate(null)).toBeNull();
    expect(parseIsoDate(undefined)).toBeNull();
  });
});
