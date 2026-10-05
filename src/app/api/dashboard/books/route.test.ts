import { NextRequest } from "next/server";

const mockInsert = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "user-1" } }, error: null }) },
    from: (table: string) => {
      if (table === "user_profile") {
        return {
          select: () => ({
            eq: () => ({ single: async () => ({ data: { book_id: "owner-1" }, error: null }) }),
          }),
        };
      }

      return {
        insert: (rows: unknown[]) => {
          mockInsert(rows);
          return {
            select: () => ({
              single: async () => ({ data: { id: "book-1", ...(rows[0] as object) }, error: null }),
            }),
          };
        },
      };
    },
  }),
}));

jest.mock("next/cache", () => ({ revalidateTag: jest.fn() }));

import { POST } from "./route";

const content = [{ id: 0, date: "23/09/2026", money: "15.000" }];

function postRequest(body: Record<string, unknown>, ip: string) {
  return new NextRequest("https://teseracto.test/api/dashboard/books", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer token",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/dashboard/books creationTime", () => {
  beforeEach(() => {
    mockInsert.mockClear();
  });

  it("stores a valid YYYY-MM-DD creationTime as given", async () => {
    const response = await POST(
      postRequest(
        { title: "23/09/2026 - 25/09/2026", content, creationTime: "2026-09-23" },
        "10.0.0.1"
      )
    );

    expect(response.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert.mock.calls[0][0][0].creationTime).toBe("2026-09-23");
  });

  it("keeps the current timestamp when creationTime is absent", async () => {
    const before = Date.now();
    const response = await POST(postRequest({ title: "Libro", content }, "10.0.0.2"));

    expect(response.status).toBe(200);
    const stored = mockInsert.mock.calls[0][0][0].creationTime as string;
    expect(new Date(stored).toISOString()).toBe(stored);
    expect(new Date(stored).getTime()).toBeGreaterThanOrEqual(before);
  });

  it.each([
    ["not a date", "yesterday"],
    ["wrong format", "23/09/2026"],
    ["impossible day", "2026-02-31"],
    ["a timestamp", "2026-09-23T10:00:00.000Z"],
    ["a number", 20260923],
    ["null", null],
    ["an empty string", ""],
  ])("rejects creationTime that is %s with 400 and stores nothing", async (_label, value) => {
    const response = await POST(
      postRequest({ title: "Libro", content, creationTime: value }, "10.0.0.3")
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid creation date" });
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
