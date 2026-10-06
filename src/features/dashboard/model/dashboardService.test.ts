const mockGetSession = jest.fn(async () => ({ data: { session: null } }));

jest.mock("@/lib/supabase/client", () => ({
  __esModule: true,
  default: { auth: { getSession: () => mockGetSession() } },
}));

import { dashboardService } from "./dashboardService";

const content = [{ id: 0, date: "23/09/2026", money: "15.000" }];

describe("dashboardService.insertBookData", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: { id: "book-1" } }) });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  const sentBody = () => JSON.parse(fetchMock.mock.calls[0][1].body as string);

  it("sends the creationTime when given", async () => {
    await dashboardService.insertBookData("23/09/2026", content, "book-1", "2026-09-23");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/dashboard/books");
    expect(sentBody()).toEqual({
      title: "23/09/2026",
      content,
      bookId: "book-1",
      creationTime: "2026-09-23",
    });
  });

  it("omits the creationTime when not given", async () => {
    await dashboardService.insertBookData("Libro", content, "book-1");

    expect(sentBody()).not.toHaveProperty("creationTime");
  });

  it("returns the created book", async () => {
    const result = await dashboardService.insertBookData("Libro", content, "book-1", "2026-09-23");

    expect(result).toEqual({ data: [{ id: "book-1" }], error: null });
  });
});
