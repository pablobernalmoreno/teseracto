/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MainData } from "@/types/dashboard";
import DataTable from "./DataTable";

const week: MainData[] = [
  { id: 1, date: "23/09/2026", money: "15.000" },
  { id: 2, date: "23/09/2026", money: "17.800" },
  { id: 3, date: "2026-09-24", money: "38.100" },
  { id: 4, date: "25/09/2026", money: "21.500" },
];

const headerCells = () =>
  within(screen.getAllByRole("row")[0])
    .getAllByRole("columnheader")
    .map((cell) => cell.textContent);

describe("DataTable with one column per date (BOOK-11)", () => {
  it("shows a column for every distinct date in order, then Ganancias", () => {
    render(<DataTable rows={week} mode="view" />);

    expect(headerCells()).toEqual(["23/09/2026", "24/09/2026", "25/09/2026", "Ganancias"]);
  });

  it("stacks a day's amounts in its column and totals each day and the whole", () => {
    render(<DataTable rows={week} mode="view" />);

    expect(screen.getByText("15,000")).toBeInTheDocument();
    expect(screen.getByText("17,800")).toBeInTheDocument();
    // 15.000 + 17.800 for the 23rd, then the other two days and the grand total.
    expect(screen.getByText("32,800")).toBeInTheDocument();
    // The 24th has a single amount, so it shows both as the amount and as the day's total.
    expect(screen.getAllByText("38,100")).toHaveLength(2);
    expect(screen.getByText("Total: 92,400")).toBeInTheDocument();
  });

  it("has a single date column plus Ganancias for a one-day book", () => {
    render(<DataTable rows={[week[0]]} mode="view" />);

    expect(headerCells()).toEqual(["23/09/2026", "Ganancias"]);
  });

  it("puts entries without a date under the book date when there is one", () => {
    render(<DataTable rows={[{ id: 9, date: "", money: "5.000" }]} fixedDate="2026-09-23" />);

    expect(headerCells()).toEqual(["23/09/2026", "Ganancias"]);
  });

  it("says there is no data for no entries", () => {
    render(<DataTable rows={[]} mode="view" />);

    expect(screen.getByText("Sin datos")).toBeInTheDocument();
  });

  describe("edit mode", () => {
    const setup = (rows: MainData[] = week) => {
      const onRowsChange = jest.fn();
      render(<DataTable rows={rows} mode="edit" onRowsChange={onRowsChange} />);
      return onRowsChange;
    };

    it("edits an amount and keeps its date", async () => {
      const onRowsChange = setup();

      await userEvent.type(screen.getAllByLabelText("Ganancias del 24/09/2026")[0], "0");

      const next = onRowsChange.mock.calls.at(-1)?.[0] as MainData[];
      expect(next.find((row) => row.id === 3)).toEqual({
        id: 3,
        date: "2026-09-24",
        money: "38.1000",
      });
    });

    it("moves every entry of a column when its date changes", () => {
      const onRowsChange = setup();

      fireEvent.change(screen.getByLabelText("Fecha de la columna 2"), {
        target: { value: "2026-09-28" },
      });

      const next = onRowsChange.mock.calls[0][0] as MainData[];
      expect(next.map((row) => row.date)).toEqual([
        "23/09/2026",
        "23/09/2026",
        "2026-09-28",
        "25/09/2026",
      ]);
    });

    it("does not move anything for an incomplete date", () => {
      const onRowsChange = setup();

      fireEvent.change(screen.getByLabelText("Fecha de la columna 2"), { target: { value: "" } });

      expect(onRowsChange.mock.calls[0][0]).toEqual(week);
    });

    it("adds an empty amount to a column", async () => {
      const onRowsChange = setup();

      await userEvent.click(screen.getByRole("button", { name: "Agregar un valor al 25/09/2026" }));

      const next = onRowsChange.mock.calls[0][0] as MainData[];
      expect(next).toHaveLength(5);
      expect(next[4]).toMatchObject({ date: "2026-09-25", money: "" });
    });

    it("adds a new date column the day after the last one", async () => {
      const onRowsChange = setup();

      await userEvent.click(screen.getByRole("button", { name: "Agregar una nueva fecha" }));

      const next = onRowsChange.mock.calls[0][0] as MainData[];
      expect(next[4]).toMatchObject({ date: "2026-09-26", money: "" });
    });

    it("removes one amount", async () => {
      const onRowsChange = setup();

      await userEvent.click(
        screen.getAllByRole("button", { name: "Eliminar valor del 23/09/2026" })[0]
      );

      expect((onRowsChange.mock.calls[0][0] as MainData[]).map((row) => row.id)).toEqual([2, 3, 4]);
    });
  });
});
