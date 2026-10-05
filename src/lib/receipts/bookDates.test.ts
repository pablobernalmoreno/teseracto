import {
  anyDateToIso,
  earliestRowDate,
  fillMissingDates,
  groupRowsByDate,
  moveColumnDate,
  nextFreeDate,
  rowsRangeTitle,
  shiftRowDates,
} from "./bookDates";

const rows = [
  { id: 1, date: "23/09/2026", money: "10.000" },
  { id: 2, date: "2026-09-24", money: "20.000" },
  { id: 3, date: "25/09/2026", money: "30.000" },
];

describe("anyDateToIso", () => {
  it("accepts both stored formats and rejects anything else", () => {
    expect(anyDateToIso("23/09/2026")).toBe("2026-09-23");
    expect(anyDateToIso("2026-09-24")).toBe("2026-09-24");
    expect(anyDateToIso("31/02/2026")).toBe("");
    expect(anyDateToIso("")).toBe("");
  });
});

describe("earliestRowDate", () => {
  it("returns the lowest date as yyyy-MM-dd, or '' when no row has a real date", () => {
    expect(earliestRowDate(rows)).toBe("2026-09-23");
    expect(earliestRowDate([{ id: 1, date: "", money: "1" }])).toBe("");
  });
});

describe("fillMissingDates", () => {
  it("keeps every row's own date and only fills the blank ones", () => {
    const filled = fillMissingDates([...rows, { id: 4, date: "", money: "5" }], "2026-09-23");
    expect(filled.map((row) => row.date)).toEqual([
      "23/09/2026",
      "2026-09-24",
      "25/09/2026",
      "2026-09-23",
    ]);
  });
});

describe("shiftRowDates", () => {
  it("moves every row by the same number of days and keeps each row's format", () => {
    const shifted = shiftRowDates(rows, "2026-09-23", "2026-09-30");
    expect(shifted.map((row) => row.date)).toEqual(["30/09/2026", "2026-10-01", "02/10/2026"]);
  });

  it("fills only blank rows when the book had no date before", () => {
    const shifted = shiftRowDates([{ id: 1, date: "", money: "1" }, rows[0]], "", "2026-09-30");
    expect(shifted.map((row) => row.date)).toEqual(["2026-09-30", "23/09/2026"]);
  });
});

describe("rowsRangeTitle", () => {
  it("is the range for several days and '' for a single day", () => {
    expect(rowsRangeTitle(rows)).toBe("23/09/2026 - 25/09/2026");
    expect(rowsRangeTitle([rows[0], rows[0]])).toBe("");
  });
});

describe("groupRowsByDate", () => {
  it("makes one column per distinct date, ascending, mixing both stored formats", () => {
    const columns = groupRowsByDate([
      { id: 1, date: "25/09/2026", money: "1" },
      { id: 2, date: "2026-09-23", money: "2" },
      { id: 3, date: "23/09/2026", money: "3" },
    ]);

    expect(columns.map((column) => column.iso)).toEqual(["2026-09-23", "2026-09-25"]);
    expect(columns[0].rows.map((row) => row.id)).toEqual([2, 3]);
  });

  it("puts entries without a date last, or under the fallback date when one is given", () => {
    const withBlank = [...rows, { id: 4, date: "", money: "5" }];

    expect(groupRowsByDate(withBlank).map((column) => column.iso)).toEqual([
      "2026-09-23",
      "2026-09-24",
      "2026-09-25",
      "",
    ]);
    expect(groupRowsByDate(withBlank, "2026-09-24")[1].rows.map((row) => row.id)).toEqual([2, 4]);
  });

  it("has no columns for no entries", () => {
    expect(groupRowsByDate([])).toEqual([]);
  });
});

describe("moveColumnDate", () => {
  it("moves only the entries of that column", () => {
    const moved = moveColumnDate(rows, "2026-09-24", "2026-09-28");

    expect(moved.map((row) => row.date)).toEqual(["23/09/2026", "2026-09-28", "25/09/2026"]);
  });

  it("merges into an existing column when the new date is already one", () => {
    const moved = moveColumnDate(rows, "2026-09-24", "2026-09-25");

    expect(groupRowsByDate(moved).map((column) => column.iso)).toEqual([
      "2026-09-23",
      "2026-09-25",
    ]);
  });

  it("ignores an incomplete or invalid date", () => {
    expect(moveColumnDate(rows, "2026-09-24", "")).toEqual(rows);
    expect(moveColumnDate(rows, "2026-09-24", "2026-02-31")).toEqual(rows);
  });
});

describe("nextFreeDate", () => {
  it("is the day after the latest date, or '' with no dates", () => {
    expect(nextFreeDate(rows)).toBe("2026-09-26");
    expect(nextFreeDate([{ id: 1, date: "", money: "1" }])).toBe("");
  });
});
