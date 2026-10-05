import { findDateOutliers } from "./dateOutliers";

const entries = (...dates: string[]) => dates.map((date, id) => ({ id, date }));
const flagged = (...dates: string[]) => [...findDateOutliers(entries(...dates))].sort();

describe("findDateOutliers", () => {
  it("flags a misread year", () => {
    expect(flagged("23/09/2026", "24/09/2026", "25/09/2026", "24/09/2062")).toEqual([3]);
  });

  it("flags a typed date far from the median", () => {
    expect(flagged("23/09/2026", "24/09/2026", "25/09/2026", "10/09/2026")).toEqual([3]);
  });

  it("flags dates far above the median as well as below it", () => {
    expect(flagged("23/09/2026", "24/09/2026", "25/09/2026", "20/10/2026")).toEqual([3]);
  });

  it("does not flag a date exactly 7 days from the median", () => {
    expect(flagged("24/09/2026", "24/09/2026", "01/10/2026")).toEqual([]);
    expect(flagged("24/09/2026", "24/09/2026", "17/09/2026")).toEqual([]);
  });

  it("flags a date 8 days from the median", () => {
    expect(flagged("24/09/2026", "24/09/2026", "02/10/2026")).toEqual([2]);
  });

  it("uses the mean of the two middle days when the count is even", () => {
    // Median is 23.5 Sep, so 1 Oct (7.5 days away) is flagged and 30 Sep (6.5 days) is not.
    expect(flagged("22/09/2026", "23/09/2026", "24/09/2026", "01/10/2026")).toEqual([3]);
    expect(flagged("22/09/2026", "23/09/2026", "24/09/2026", "30/09/2026")).toEqual([]);
  });

  it("counts calendar days across month and year boundaries", () => {
    expect(flagged("30/12/2026", "31/12/2026", "02/01/2027")).toEqual([]);
    expect(flagged("30/12/2026", "31/12/2026", "02/01/2027", "15/01/2027")).toEqual([3]);
  });

  it("flags both dates of a two-entry upload more than 7 days apart", () => {
    expect(flagged("14/09/2026", "24/09/2026")).toEqual([0, 1]);
  });

  it("does not flag two entries 7 days apart or fewer", () => {
    expect(flagged("17/09/2026", "24/09/2026")).toEqual([]);
    expect(flagged("23/09/2026", "24/09/2026")).toEqual([]);
  });

  it("never flags a lone dated entry", () => {
    expect(flagged("24/09/2026")).toEqual([]);
    expect(flagged("24/09/2062")).toEqual([]);
  });

  it("ignores entries without a real date", () => {
    expect(flagged("", "24/09/2026", "N/A", "31/02/2026")).toEqual([]);
    expect(flagged("", "23/09/2026", "24/09/2026", "25/09/2026", "10/09/2026")).toEqual([4]);
  });

  it("flags nothing for an empty upload", () => {
    expect(flagged()).toEqual([]);
  });

  it("flags by entry id, not by position", () => {
    const result = findDateOutliers([
      { id: 7, date: "23/09/2026" },
      { id: 3, date: "24/09/2026" },
      { id: 9, date: "25/09/2026" },
      { id: 5, date: "01/01/2026" },
    ]);
    expect([...result]).toEqual([5]);
  });
});
