import { expireMembership } from "./membership";

type Tier = "free" | "member" | "admin";
type Status = "active" | "trialing" | "past_due" | "canceled" | "expired" | "suspended";

interface TestMembership {
  tier: Tier;
  status: Status;
  starts_at: string;
  ends_at: string | null;
  provider: string | null;
}

const NOW = new Date("2026-10-06T12:00:00.000Z");
const PAST = "2026-08-27T20:44:31.388Z";
const FUTURE = "2026-11-01T00:00:00.000Z";

const membership = (overrides: Partial<TestMembership> = {}): TestMembership => ({
  tier: "member",
  status: "active",
  starts_at: "2026-07-27T20:44:31.388Z",
  ends_at: PAST,
  provider: "wompi",
  ...overrides,
});

describe("expireMembership", () => {
  it.each<Status>(["active", "trialing"])(
    "turns a %s member past its end into an expired free membership and keeps ends_at",
    (status) => {
      const input = membership({ status });

      expect(expireMembership(input, NOW)).toEqual({
        ...input,
        tier: "free",
        status: "expired",
        ends_at: PAST,
      });
    }
  );

  it("does not change the input object", () => {
    const input = membership();

    expireMembership(input, NOW);

    expect(input).toEqual(membership());
  });

  it("expires at exactly ends_at and not one millisecond before", () => {
    const endsAt = NOW.toISOString();

    expect(expireMembership(membership({ ends_at: endsAt }), NOW).status).toBe("expired");
    expect(
      expireMembership(membership({ ends_at: endsAt }), new Date(NOW.getTime() - 1)).status
    ).toBe("active");
  });

  it("returns the same reference while the membership is still running", () => {
    const input = membership({ ends_at: FUTURE });

    expect(expireMembership(input, NOW)).toBe(input);
  });

  it("never expires a membership without an end", () => {
    const input = membership({ ends_at: null });

    expect(expireMembership(input, NOW)).toBe(input);
  });

  it("never expires the admin tier", () => {
    const input = membership({ tier: "admin" });

    expect(expireMembership(input, NOW)).toBe(input);
  });

  it.each<Status>(["past_due", "canceled", "expired", "suspended"])(
    "leaves a %s membership as stored",
    (status) => {
      const input = membership({ status });

      expect(expireMembership(input, NOW)).toBe(input);
    }
  );

  it("leaves a free membership as stored", () => {
    const input = membership({ tier: "free", ends_at: PAST });

    expect(expireMembership(input, NOW)).toBe(input);
  });

  it("fails open on an end date that cannot be read: the membership stays as stored", () => {
    const input = membership({ ends_at: "not a date" });

    expect(expireMembership(input, NOW)).toBe(input);
  });

  it("uses the current time when none is given", () => {
    const input = membership({ ends_at: new Date(Date.now() - 60_000).toISOString() });

    expect(expireMembership(input).status).toBe("expired");
  });
});
