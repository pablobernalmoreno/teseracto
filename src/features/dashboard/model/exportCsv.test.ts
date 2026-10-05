/**
 * @jest-environment jsdom
 */
jest.mock("./dashboardService", () => ({
  dashboardService: { fetchBookContent: jest.fn() },
}));

import { dashboardService } from "./dashboardService";
import { buildBookCsv, exportBookToCsv } from "./exportCsv";

const fetchBookContent = jest.mocked(dashboardService.fetchBookContent);
// Captured once: a spy installed on Blob in every test must not wrap its own previous spy.
const RealBlob = globalThis.Blob;

const week = [
  { id: 1, date: "23/09/2026", money: "15.000" },
  { id: 2, date: "23/09/2026", money: "17.800" },
  { id: 3, date: "2026-09-24", money: "38.100" },
  { id: 4, date: "25/09/2026", money: "21.500" },
];

describe("buildBookCsv", () => {
  it("has a column per date, the amounts stacked, then Ganancias and a totals row", () => {
    expect(buildBookCsv(week).split("\r\n")).toEqual([
      "23/09/2026;24/09/2026;25/09/2026;Ganancias",
      "15000;38100;21500;",
      "17800;;;",
      "32800;38100;21500;92400",
    ]);
  });

  it("sorts columns by date whatever the order of the entries and mixes both stored formats", () => {
    const [header] = buildBookCsv([week[3], week[2], week[0]]).split("\r\n");

    expect(header).toBe("23/09/2026;24/09/2026;25/09/2026;Ganancias");
  });

  it("puts entries without a date in a Sin fecha column, or under the book date when given", () => {
    const rows = [...week.slice(0, 1), { id: 9, date: "", money: "5.000" }];

    expect(buildBookCsv(rows).split("\r\n")[0]).toBe("23/09/2026;Sin fecha;Ganancias");
    expect(buildBookCsv(rows, "2026-09-23").split("\r\n")[0]).toBe("23/09/2026;Ganancias");
  });

  it("uses a decimal comma and leaves an entry without an amount empty", () => {
    const csv = buildBookCsv([
      { id: 1, date: "23/09/2026", money: "1.234,50" },
      { id: 2, date: "23/09/2026", money: "" },
    ]);

    expect(csv.split("\r\n")).toEqual(["23/09/2026;Ganancias", "1234,5;", ";", "1234,5;1234,5"]);
  });

  it("is just a header and a zero total for an empty book", () => {
    expect(buildBookCsv([])).toBe("Ganancias\r\n0");
  });
});

describe("exportBookToCsv", () => {
  let blobs: BlobPart[][];
  let downloads: string[];

  beforeEach(() => {
    jest.clearAllMocks();
    blobs = [];
    downloads = [];
    jest.spyOn(globalThis, "Blob").mockImplementation(((
      parts: BlobPart[],
      options?: BlobPropertyBag
    ) => {
      blobs.push(parts);
      return new RealBlob(parts, options);
    }) as unknown as typeof Blob);
    URL.createObjectURL = jest.fn(() => "blob:csv");
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloads.push(this.download);
    });
  });

  it("downloads a UTF-8 file with a BOM, named after the book", async () => {
    await exportBookToCsv({ bookId: "b1", bookTitle: "23/09/2026 - 25/09/2026", rows: week });

    expect(downloads).toEqual(["23092026 - 25092026.csv"]);
    expect(blobs[0][0]).toMatch(/^﻿23\/09\/2026;24\/09\/2026;25\/09\/2026;Ganancias/);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:csv");
    expect(document.querySelector("a[download]")).toBeNull();
  });

  it("falls back to the name 'libro' when the title has no usable characters", async () => {
    await exportBookToCsv({ bookId: "b1", bookTitle: "///", rows: week });

    expect(downloads).toEqual(["libro.csv"]);
  });

  it("fetches the rows when none are loaded", async () => {
    fetchBookContent.mockResolvedValue({
      data: { content: week },
      error: null,
    } as unknown as Awaited<ReturnType<typeof dashboardService.fetchBookContent>>);

    await exportBookToCsv({ bookId: "b1", bookTitle: "Semana" });

    expect(fetchBookContent).toHaveBeenCalledWith("b1");
    expect(blobs[0][0]).toContain("92400");
  });

  it("fails closed when the rows cannot be fetched: nothing is downloaded", async () => {
    fetchBookContent.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    } as unknown as Awaited<ReturnType<typeof dashboardService.fetchBookContent>>);

    await expect(exportBookToCsv({ bookId: "b1", bookTitle: "Semana" })).rejects.toThrow("boom");
    expect(downloads).toEqual([]);
  });
});
