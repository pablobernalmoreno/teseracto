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
        insert: (row: object) => {
          mockInsert(row);
          return {
            select: () => ({
              single: async () => ({ data: { id: "book-1", ...row }, error: null }),
            }),
          };
        },
      };
    },
  }),
}));

jest.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "10.9.0.1" }),
}));
jest.mock("next/cache", () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  updateTag: jest.fn(),
}));

import { createBook } from "./dashboard";

const content = [{ id: 0, date: "23/09/2026", money: "15.000" }];

describe("createBook creationTime", () => {
  beforeEach(() => mockInsert.mockClear());

  it("accepts a real YYYY-MM-DD date", async () => {
    const result = await createBook("Libro", content, undefined, "2026-09-23");

    expect(result.error).toBeNull();
    expect(mockInsert.mock.calls[0][0].creationTime).toBe("2026-09-23");
  });

  it.each([
    ["an impossible day", "2026-02-31"],
    ["not a date", "yesterday"],
    ["a timestamp", "2026-09-23T10:00:00Z"],
  ])("rejects a creationTime that is %s and stores nothing", async (_label, value) => {
    const result = await createBook("Libro", content, undefined, value);

    expect(result.error).toBe("Invalid creation date");
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
