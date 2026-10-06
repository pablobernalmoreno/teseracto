import {
  dateRangeTitle,
  earliestIsoDate,
  extractDate,
  extractDates,
  displayToIso,
  isoToDisplay,
  sortEntriesByDate,
  toDayNumber,
} from "./dates";

describe("extractDate", () => {
  it("reads a written month with 'de'", () => {
    expect(extractDate("Fecha 5 de marzo de 2026")).toBe("05/03/2026");
  });

  it("reads the abbreviated September used by Bre-B ('sept')", () => {
    expect(extractDate("23 sept 2026 - 3:35 p.m.")).toBe("23/09/2026");
    expect(extractDate("23 Sept 2026 - 12:10 p m.")).toBe("23/09/2026");
    expect(extractDate("23 sept. 2026")).toBe("23/09/2026");
  });

  it("reads 'sep' in any case and the full month name", () => {
    expect(extractDate("ll 25 SEP 2026 - 19:40:59")).toBe("25/09/2026");
    expect(extractDate("23 de septiembre de 2026 a las 06:31 p. m.")).toBe("23/09/2026");
    expect(extractDate("3 de setiembre de 2026")).toBe("03/09/2026");
  });

  it("reads the other months and accented spellings", () => {
    expect(extractDate("1 ene 2026")).toBe("01/01/2026");
    expect(extractDate("14 de agosto de 2026")).toBe("14/08/2026");
    expect(extractDate("30 de diciembre de 2026")).toBe("30/12/2026");
  });

  it("reads dd/mm/yyyy", () => {
    expect(extractDate("Fecha: 05/03/2026")).toBe("05/03/2026");
  });

  it("returns the first real date when the text holds several", () => {
    expect(extractDate("45 sept 2026\n24 sept 2026\n25 sept 2026")).toBe("24/09/2026");
  });

  it("treats an impossible day as no date", () => {
    expect(extractDate("45 sept 2026")).toBeNull();
    expect(extractDate("31 de abril de 2026")).toBeNull();
    expect(extractDate("31/02/2026")).toBeNull();
    expect(extractDate("00/09/2026")).toBeNull();
  });

  it("does not take a day out of the tail of a longer number", () => {
    expect(extractDate("245sept 2026")).toBeNull();
    expect(extractDate("0092880655 sept 2026")).toBeNull();
  });

  it("ignores words that are not months", () => {
    expect(extractDate("23 pesos 2026")).toBeNull();
    expect(extractDate("Comprobante No. 0000008900")).toBeNull();
    expect(extractDate("")).toBeNull();
  });

  it("requires a full four-digit year", () => {
    expect(extractDate("25 sept 202¢ _ 7:44 p.M")).toBeNull();
    expect(extractDate("25 sept 20261")).toBeNull();
  });
});

describe("extractDates replay of OCR lines from real receipts", () => {
  // Lines copied from the OCR output of the sample receipts (no names or account numbers).
  const cases: [string, string | null][] = [
    ["WV 23 Sept 2026 - 12:10 p m.", "23/09/2026"],
    ["23 sept 2026 - 3:35 p.m.", "23/09/2026"],
    ["el 23 sept 2026 - 3.56 p.m. —", "23/09/2026"],
    ["23 de septiembre de 2026 alas 01 03p.m -", "23/09/2026"],
    ["23 de septiembre de 2026 a las 12:46h", "23/09/2026"],
    ["24 sept 2026 - 8:08 p.m. fF", "24/09/2026"],
    ["25 sept 2026 - 639 pm. s", "25/09/2026"],
    ["ll 25 SEP 2026 - 19:40:59", "25/09/2026"],
    // Not readable: the reader is left to the manual-entry flow instead of guessing.
    ["82 ¢ \ ¥ _~ 245sept 2026 - 7:33 p.m. Se Miciseq Pru", null],
    ["25 sept 202¢ _ 7:44 p.M I", null],
    ["| 21, de septiembre de 2026 alas 01:26 p. M.", null],
  ];

  it.each(cases)("%s", (line, expected) => {
    expect(extractDate(line)).toBe(expected);
  });

  it("keeps one result per image, in order", () => {
    expect(extractDates(["23 sept 2026", "nada", "25 SEP 2026"])).toEqual([
      "23/09/2026",
      null,
      "25/09/2026",
    ]);
  });
});

describe("dateRangeTitle", () => {
  it("spans the lowest to the highest date", () => {
    expect(dateRangeTitle(["24/09/2026", "23/09/2026", "25/09/2026"])).toBe(
      "23/09/2026 - 25/09/2026"
    );
  });

  it("uses a single date when every entry shares it", () => {
    expect(dateRangeTitle(["23/09/2026", "23/09/2026"])).toBe("23/09/2026");
  });

  it("widens when an earlier date is typed", () => {
    expect(dateRangeTitle(["23/09/2026", "25/09/2026", "22/09/2026"])).toBe(
      "22/09/2026 - 25/09/2026"
    );
  });

  it("orders by calendar date across a year boundary, not as text", () => {
    expect(dateRangeTitle(["02/01/2027", "30/12/2026"])).toBe("30/12/2026 - 02/01/2027");
  });

  it("ignores dates that are not real and returns an empty string when none are", () => {
    expect(dateRangeTitle(["", "N/A", "23/09/2026"])).toBe("23/09/2026");
    expect(dateRangeTitle(["", "31/02/2026"])).toBe("");
    expect(dateRangeTitle([])).toBe("");
  });
});

describe("earliestIsoDate", () => {
  it("returns the lowest date as yyyy-MM-dd", () => {
    expect(earliestIsoDate(["24/09/2026", "22/09/2026", "25/09/2026"])).toBe("2026-09-22");
    expect(earliestIsoDate(["02/01/2027", "30/12/2026"])).toBe("2026-12-30");
  });

  it("returns null when no date is real", () => {
    expect(earliestIsoDate([])).toBeNull();
    expect(earliestIsoDate(["", "N/A"])).toBeNull();
  });
});

describe("sortEntriesByDate", () => {
  it("orders ascending by calendar date", () => {
    const sorted = sortEntriesByDate([
      { id: 0, date: "25/09/2026" },
      { id: 1, date: "23/09/2026" },
      { id: 2, date: "24/09/2026" },
    ]);
    expect(sorted.map((entry) => entry.id)).toEqual([1, 2, 0]);
  });

  it("keeps upload order for entries with the same date", () => {
    const sorted = sortEntriesByDate([
      { id: 0, date: "24/09/2026" },
      { id: 1, date: "23/09/2026" },
      { id: 2, date: "24/09/2026" },
      { id: 3, date: "23/09/2026" },
    ]);
    expect(sorted.map((entry) => entry.id)).toEqual([1, 3, 0, 2]);
  });

  it("puts entries without a real date last instead of dropping them", () => {
    const sorted = sortEntriesByDate([
      { id: 0, date: "" },
      { id: 1, date: "24/09/2026" },
    ]);
    expect(sorted.map((entry) => entry.id)).toEqual([1, 0]);
  });

  it("does not change the input", () => {
    const input = [
      { id: 0, date: "25/09/2026" },
      { id: 1, date: "23/09/2026" },
    ];
    sortEntriesByDate(input);
    expect(input.map((entry) => entry.id)).toEqual([0, 1]);
  });
});

describe("toDayNumber", () => {
  it("is exact in days across month lengths and leap years", () => {
    const day = (value: string) => toDayNumber(value) as number;
    expect(day("01/03/2028") - day("28/02/2028")).toBe(2);
    expect(day("01/03/2027") - day("28/02/2027")).toBe(1);
  });

  it("returns null for text that is not a real dd/MM/yyyy date", () => {
    expect(toDayNumber("2026-09-23")).toBeNull();
    expect(toDayNumber("31/02/2026")).toBeNull();
    expect(toDayNumber("")).toBeNull();
  });
});

describe("isoToDisplay and displayToIso", () => {
  it("converts between the date input value and the display format", () => {
    expect(isoToDisplay("2026-09-22")).toBe("22/09/2026");
    expect(displayToIso("22/09/2026")).toBe("2026-09-22");
  });

  it("returns an empty string for anything that is not a real date", () => {
    expect(isoToDisplay("")).toBe("");
    expect(isoToDisplay("2026-02-31")).toBe("");
    expect(isoToDisplay("02026-09-22")).toBe("");
    expect(isoToDisplay("22/09/2026")).toBe("");
    expect(displayToIso("")).toBe("");
    expect(displayToIso("31/02/2026")).toBe("");
    expect(displayToIso("2026-09-22")).toBe("");
  });
});
