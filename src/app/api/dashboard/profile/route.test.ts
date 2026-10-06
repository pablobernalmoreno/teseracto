import { NextRequest } from "next/server";

const mockMembership = jest.fn();
const mockUser = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => mockUser() },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () =>
            table === "user_profile"
              ? { data: { id: "user-1", book_id: "book-1" }, error: null }
              : mockMembership(),
        }),
      }),
    }),
  }),
}));

import { GET } from "./route";

const request = () =>
  new NextRequest("https://teseracto.test/api/dashboard/profile", {
    headers: { authorization: "Bearer token" },
  });

const row = (overrides: Record<string, unknown> = {}) => ({
  tier: "member",
  status: "active",
  starts_at: "2026-07-27T20:44:31.388Z",
  ends_at: "2026-08-27T20:44:31.388Z",
  provider: "wompi",
  provider_subscription_id: "ref-1",
  auto_renew: false,
  canceled_at: null,
  ...overrides,
});

describe("GET /api/dashboard/profile membership (BILL-8)", () => {
  beforeEach(() => {
    mockUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  });

  it("reports a lapsed member as expired and free, with the same end date", async () => {
    mockMembership.mockResolvedValue({ data: row(), error: null });

    const body = await (await GET(request())).json();

    expect(body.data[0].membership).toMatchObject({
      tier: "free",
      status: "expired",
      ends_at: "2026-08-27T20:44:31.388Z",
    });
  });

  it("leaves a membership that is still running as stored", async () => {
    const running = row({ ends_at: new Date(Date.now() + 86_400_000).toISOString() });
    mockMembership.mockResolvedValue({ data: running, error: null });

    const body = await (await GET(request())).json();

    expect(body.data[0].membership).toEqual(running);
  });

  it("keeps the free fallback when the user has no membership row", async () => {
    mockMembership.mockResolvedValue({ data: null, error: null });

    const body = await (await GET(request())).json();

    expect(body.data[0].membership).toMatchObject({
      tier: "free",
      status: "active",
      ends_at: null,
    });
  });

  it("still answers 500 when the membership cannot be read", async () => {
    mockMembership.mockResolvedValue({ data: null, error: { message: "boom" } });

    expect((await GET(request())).status).toBe(500);
  });
});
