// Membership expiry (BILL-8). The same rule runs in the database
// (`public.expire_user_memberships`, migrations/20261006_expire_user_memberships.sql), which makes
// the stored row match; this helper makes what the API reports correct before that job has run.

interface ExpirableMembership {
  tier: "free" | "member" | "admin";
  status: "active" | "trialing" | "past_due" | "canceled" | "expired" | "suspended";
  ends_at: string | null;
}

/**
 * A `member` that is `active` or `trialing` and whose `ends_at` is not after `now` is returned as an
 * expired `free` membership, with `ends_at` kept. Anything else (no end, the `admin` tier, any other
 * status or tier, a running membership) comes back as the same reference.
 *
 * Fails open: an `ends_at` that cannot be read leaves the membership as stored, so bad data never
 * takes Pro away; the database job is the one that settles it. The complement is a readable date
 * that has passed, which is expired.
 */
export function expireMembership<T extends ExpirableMembership>(
  membership: T,
  now: Date = new Date()
): T {
  if (membership.tier !== "member") return membership;
  if (membership.status !== "active" && membership.status !== "trialing") return membership;
  if (!membership.ends_at) return membership;

  const endsAt = new Date(membership.ends_at).getTime();
  if (Number.isNaN(endsAt) || endsAt > now.getTime()) return membership;

  return { ...membership, tier: "free", status: "expired" };
}
