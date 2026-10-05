/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import type { BookData } from "@/app/actions/dashboard";

// recharts draws nothing without a real layout size, so the chart is replaced by a node that
// prints the data it was given. The grouping under test happens before the chart.
jest.mock("recharts", () => {
  const Passthrough = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  return {
    ResponsiveContainer: Passthrough,
    LineChart: ({ data }: { data: unknown }) => (
      <pre data-testid="chart-data">{JSON.stringify(data)}</pre>
    ),
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
  };
});

import { DashboardHistoryView } from "./DashboardHistoryView";

const book = (id: string, content: BookData["content"]): BookData => ({
  id,
  title: id,
  content,
});

const chartPoints = () =>
  (
    JSON.parse(screen.getByTestId("chart-data").textContent ?? "[]") as {
      isoDate: string;
      total: number;
    }[]
  ).map(({ isoDate, total }) => ({ isoDate, total }));

describe("DashboardHistoryView with a book spanning several dates", () => {
  it("groups the chart by each entry's own date, in date order, summing across books", () => {
    render(
      <DashboardHistoryView
        onBack={jest.fn()}
        books={[
          book("semana", [
            { id: 2, date: "25/09/2026", money: "65.800" },
            { id: 0, date: "23/09/2026", money: "15.000" },
            { id: 1, date: "24/09/2026", money: "51.600" },
          ]),
          book("otro", [{ id: 0, date: "24/09/2026", money: "20.000" }]),
        ]}
      />
    );

    expect(chartPoints()).toEqual([
      { isoDate: "2026-09-23", total: 15000 },
      { isoDate: "2026-09-24", total: 71600 },
      { isoDate: "2026-09-25", total: 65800 },
    ]);
  });

  it("skips entries without a usable date instead of failing", () => {
    render(
      <DashboardHistoryView
        onBack={jest.fn()}
        books={[
          book("a", [
            { id: 0, date: "23/09/2026", money: "15.000" },
            { id: 1, date: "", money: "9.000" },
          ]),
        ]}
      />
    );

    expect(chartPoints()).toEqual([{ isoDate: "2026-09-23", total: 15000 }]);
  });
});
