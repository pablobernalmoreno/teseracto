/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import type { MainData } from "@/types/dashboard";

const weekRows: MainData[] = [
  { id: 1, date: "23/09/2026", money: "10.000" },
  { id: 2, date: "24/09/2026", money: "20.000" },
  { id: 3, date: "25/09/2026", money: "30.000" },
];

const mockSaveDetailRows = jest.fn(async (..._args: unknown[]) => ({ error: null }));

jest.mock("./useDashboardBooksData", () => ({
  useDashboardBooksData: () => ({
    books: [
      { id: "b1", title: "23/09/2026 - 25/09/2026", content: [], creationTime: "2026-09-23" },
    ],
    booksCount: 1,
    isPending: false,
    totalPages: 1,
    fetchDetailRows: async () => weekRows.map((row) => ({ ...row })),
    saveDetailRows: (...args: unknown[]) => mockSaveDetailRows(...args),
    refreshCurrentPage: jest.fn(async () => undefined),
  }),
}));

// The server actions pull in next/cache, which does not load under jsdom.
jest.mock("@/app/actions/dashboard", () => ({ deleteBooks: jest.fn() }));

jest.mock("./DashboardModalContext", () => ({
  useDashboardModals: () => ({ showToast: jest.fn() }),
}));

import { useMainDashboardState } from "./useMainDashboardState";

async function openWeekBook() {
  const hook = renderHook(() => useMainDashboardState({ initialBooks: [], initialBooksCount: 0 }));
  await act(async () => {
    await hook.result.current.actions.openDetail("b1");
  });
  return hook;
}

describe("useMainDashboardState detail view of a multi-day book (BOOK-10)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("saves every row with its own date and dates the book by the lowest one", async () => {
    const { result } = await openWeekBook();

    await act(async () => {
      result.current.actions.handleSaveDetail();
    });

    const [, rows, creationTime, title] = mockSaveDetailRows.mock.calls[0];
    expect((rows as MainData[]).map((row) => row.date)).toEqual([
      "23/09/2026",
      "24/09/2026",
      "25/09/2026",
    ]);
    expect(creationTime).toBe("2026-09-23");
    expect(title).toBe("23/09/2026 - 25/09/2026");
  });

  it("moves the whole week when the book date changes, and renames the automatic range title", async () => {
    const { result } = await openWeekBook();

    act(() => result.current.actions.handleDetailDateChange("2026-09-30"));

    expect(result.current.state.editedRows.map((row) => row.date)).toEqual([
      "30/09/2026",
      "01/10/2026",
      "02/10/2026",
    ]);
    expect(result.current.state.activeCardTitle).toBe("30/09/2026 - 02/10/2026");

    await act(async () => {
      result.current.actions.handleSaveDetail();
    });
    expect(mockSaveDetailRows.mock.calls[0][2]).toBe("2026-09-30");
  });

  it("keeps a title the user wrote when the book date changes", async () => {
    const { result } = await openWeekBook();

    act(() => result.current.actions.handleDetailTitleChange("Semana de la feria"));
    act(() => result.current.actions.handleDetailDateChange("2026-09-30"));

    expect(result.current.state.activeCardTitle).toBe("Semana de la feria");
  });
});
