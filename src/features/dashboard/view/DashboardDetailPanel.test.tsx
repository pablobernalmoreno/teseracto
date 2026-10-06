/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

jest.mock("@/features/dashboard/model/exportCsv", () => ({ exportBookToCsv: jest.fn() }));
jest.mock("@/features/dashboard/components/dataTable/DataTable", () => ({
  __esModule: true,
  default: () => null,
}));

import { exportBookToCsv } from "@/features/dashboard/model/exportCsv";
import { DashboardDetailPanel } from "./DashboardDetailPanel";

const exportCsv = jest.mocked(exportBookToCsv);

const renderPanel = () =>
  render(
    <DashboardDetailPanel
      bookId="b1"
      title="Semana"
      bookDate="2026-09-23"
      hasUnsavedChanges={false}
      editedRows={[{ id: 1, date: "23/09/2026", money: "5.000" }]}
      isPending={false}
      onBack={jest.fn()}
      onSave={jest.fn()}
      onSaveAndExit={jest.fn()}
      onBookDateChange={jest.fn()}
      onRowsChange={jest.fn()}
    />
  );

describe("DashboardDetailPanel CSV export", () => {
  beforeEach(() => exportCsv.mockReset());

  it("exports with the book date so undated entries match the table", async () => {
    exportCsv.mockResolvedValue();
    renderPanel();

    await userEvent.click(screen.getByRole("button", { name: /exportar a csv/i }));

    expect(exportCsv).toHaveBeenCalledWith(expect.objectContaining({ bookDate: "2026-09-23" }));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("tells the user when the export fails", async () => {
    exportCsv.mockRejectedValue(new Error("boom"));
    renderPanel();

    await userEvent.click(screen.getByRole("button", { name: /exportar a csv/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo exportar el libro");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /exportar a csv/i })).toBeEnabled()
    );
  });
});
