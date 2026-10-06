import {
  attentionEntries,
  buildBookFromEntries,
  canSaveEntries,
  describeEntryIssues,
  entriesFromReads,
  formatMoneyForSave,
  getEntryIssues,
  needsAttention,
  parseMoneyToNumber,
  unreadableEntries,
} from "./reviewEntries";

const entry = (id: number, date: string, money: string) => ({ id, date, money });
const noConfirmations = new Map<number, string>();

describe("entriesFromReads", () => {
  it("keeps one entry per image with its own date and amount", () => {
    expect(
      entriesFromReads([
        { date: "23/09/2026", money: "15.000" },
        { date: null, money: "" },
      ])
    ).toEqual([entry(0, "23/09/2026", "15.000"), entry(1, "", "")]);
  });
});

describe("unreadableEntries", () => {
  it("leaves every image for manual entry", () => {
    expect(unreadableEntries(2)).toEqual([entry(0, "", ""), entry(1, "", "")]);
  });
});

describe("getEntryIssues", () => {
  it("flags only the image whose date is missing", () => {
    const issues = getEntryIssues(
      [entry(0, "23/09/2026", "1.000"), entry(1, "", "2.000"), entry(2, "24/09/2026", "3.000")],
      noConfirmations
    );

    expect(issues.get(0)).toEqual({ missingDate: false, missingAmount: false, dateOutlier: false });
    expect(issues.get(1)).toEqual({ missingDate: true, missingAmount: false, dateOutlier: false });
    expect(issues.get(2)).toEqual({ missingDate: false, missingAmount: false, dateOutlier: false });
  });

  it("flags a missing amount, including the N/A placeholder", () => {
    const issues = getEntryIssues(
      [entry(0, "23/09/2026", ""), entry(1, "23/09/2026", "N/A"), entry(2, "23/09/2026", "1.000")],
      noConfirmations
    );

    expect(issues.get(0)?.missingAmount).toBe(true);
    expect(issues.get(1)?.missingAmount).toBe(true);
    expect(issues.get(2)?.missingAmount).toBe(false);
  });

  it("treats a date that is not real as missing", () => {
    const issues = getEntryIssues([entry(0, "31/02/2026", "1.000")], noConfirmations);
    expect(issues.get(0)?.missingDate).toBe(true);
  });

  it("flags a date far from the others until the user confirms that date", () => {
    const entries = [
      entry(0, "23/09/2026", "1.000"),
      entry(1, "24/09/2026", "1.000"),
      entry(2, "25/09/2026", "1.000"),
      entry(3, "24/09/2062", "1.000"),
    ];

    expect(getEntryIssues(entries, noConfirmations).get(3)?.dateOutlier).toBe(true);
    expect(getEntryIssues(entries, new Map([[3, "24/09/2062"]])).get(3)?.dateOutlier).toBe(false);
  });

  it("checks the entry again when its date changed after it was confirmed", () => {
    const entries = [
      entry(0, "23/09/2026", "1.000"),
      entry(1, "24/09/2026", "1.000"),
      entry(2, "25/09/2026", "1.000"),
      entry(3, "24/09/2063", "1.000"),
    ];

    const stale = new Map([[3, "24/09/2062"]]);
    expect(getEntryIssues(entries, stale).get(3)?.dateOutlier).toBe(true);
  });
});

describe("attentionEntries", () => {
  const entries = [entry(0, "23/09/2026", "1.000"), entry(1, "", ""), entry(2, "24/09/2026", "")];

  it("lists entries that need attention now", () => {
    const issues = getEntryIssues(entries, noConfirmations);
    expect(attentionEntries(entries, issues, new Set()).map((e) => e.id)).toEqual([1, 2]);
  });

  it("keeps entries that needed attention when read, even after they are fixed", () => {
    const fixed = [
      entry(0, "23/09/2026", "1.000"),
      entry(1, "23/09/2026", "5.000"),
      entry(2, "24/09/2026", ""),
    ];
    const issues = getEntryIssues(fixed, noConfirmations);

    expect(attentionEntries(fixed, issues, new Set([1, 2])).map((e) => e.id)).toEqual([1, 2]);
  });

  it("adds an entry that becomes flagged after an edit", () => {
    const edited = [
      entry(0, "23/09/2026", "1.000"),
      entry(1, "24/09/2026", "1.000"),
      entry(2, "25/09/2026", "1.000"),
      entry(3, "10/09/2026", "1.000"),
    ];
    const issues = getEntryIssues(edited, noConfirmations);

    expect(attentionEntries(edited, issues, new Set()).map((e) => e.id)).toEqual([3]);
  });
});

describe("canSaveEntries", () => {
  it("allows saving when every entry has a date and an amount and nothing is flagged", () => {
    const entries = [entry(0, "23/09/2026", "1.000"), entry(1, "24/09/2026", "2.000")];
    expect(canSaveEntries(entries, getEntryIssues(entries, noConfirmations))).toBe(true);
  });

  it("blocks saving while a date or an amount is missing", () => {
    const missingDate = [entry(0, "", "1.000")];
    const missingAmount = [entry(0, "23/09/2026", "")];

    expect(canSaveEntries(missingDate, getEntryIssues(missingDate, noConfirmations))).toBe(false);
    expect(canSaveEntries(missingAmount, getEntryIssues(missingAmount, noConfirmations))).toBe(
      false
    );
  });

  it("blocks saving while an outlier is unconfirmed and allows it once confirmed", () => {
    const entries = [
      entry(0, "23/09/2026", "1.000"),
      entry(1, "24/09/2026", "1.000"),
      entry(2, "25/09/2026", "1.000"),
      entry(3, "24/09/2062", "1.000"),
    ];

    expect(canSaveEntries(entries, getEntryIssues(entries, noConfirmations))).toBe(false);
    expect(canSaveEntries(entries, getEntryIssues(entries, new Map([[3, "24/09/2062"]])))).toBe(
      true
    );
  });

  it("blocks saving with nothing to save", () => {
    expect(canSaveEntries([], new Map())).toBe(false);
  });
});

describe("describeEntryIssues", () => {
  it("describes each kind of issue and nothing when there is none", () => {
    const base = { missingDate: false, missingAmount: false, dateOutlier: false };

    expect(describeEntryIssues({ ...base, missingDate: true })).toContain("fecha");
    expect(describeEntryIssues({ ...base, missingAmount: true })).toContain("valor");
    expect(describeEntryIssues({ ...base, missingDate: true, missingAmount: true })).toContain(
      "fecha y el valor"
    );
    expect(describeEntryIssues({ ...base, dateOutlier: true })).toContain("7 días");
    expect(describeEntryIssues(base)).toBeUndefined();
    expect(needsAttention(base)).toBe(false);
  });
});

describe("money", () => {
  it("parses Colombian and plain amounts", () => {
    expect(parseMoneyToNumber("51.600")).toBe(51600);
    expect(parseMoneyToNumber("51600")).toBe(51600);
    expect(parseMoneyToNumber("1.234,50")).toBe(1234.5);
    expect(parseMoneyToNumber("$ 15.000")).toBe(15000);
    expect(parseMoneyToNumber("")).toBe(0);
  });

  it("formats for saving as es-CO", () => {
    expect(formatMoneyForSave("51600")).toBe("51.600");
    expect(formatMoneyForSave("15.000")).toBe("15.000");
    expect(formatMoneyForSave("1.234,50")).toBe("1.234,5");
  });
});

describe("buildBookFromEntries", () => {
  it("titles a three-day upload by its range, orders entries and dates the book by the lowest", () => {
    const book = buildBookFromEntries([
      entry(0, "25/09/2026", "65.800"),
      entry(1, "23/09/2026", "15000"),
      entry(2, "24/09/2026", "51.600"),
    ]);

    expect(book?.title).toBe("23/09/2026 - 25/09/2026");
    expect(book?.creationTime).toBe("2026-09-23");
    expect(book?.content).toEqual([
      entry(1, "23/09/2026", "15.000"),
      entry(2, "24/09/2026", "51.600"),
      entry(0, "25/09/2026", "65.800"),
    ]);
  });

  it("widens the range when an earlier date was typed", () => {
    const book = buildBookFromEntries([
      entry(0, "23/09/2026", "1.000"),
      entry(1, "22/09/2026", "2.000"),
      entry(2, "25/09/2026", "3.000"),
    ]);

    expect(book?.title).toBe("22/09/2026 - 25/09/2026");
    expect(book?.creationTime).toBe("2026-09-22");
  });

  it("uses a single date when all entries share it, keeping upload order", () => {
    const book = buildBookFromEntries([
      entry(0, "23/09/2026", "1.000"),
      entry(1, "23/09/2026", "2.000"),
    ]);

    expect(book?.title).toBe("23/09/2026");
    expect(book?.content.map((e) => e.id)).toEqual([0, 1]);
  });

  it("returns null when there is nothing to save or no real date", () => {
    expect(buildBookFromEntries([])).toBeNull();
    expect(buildBookFromEntries([entry(0, "", "1.000")])).toBeNull();
  });
});
