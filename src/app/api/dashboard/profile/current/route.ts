import crypto from "node:crypto";

import { createClient } from "@/app/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { GENERIC_REQUEST_ERROR, getBearerToken } from "@/app/utils/security/validation";

interface UserProfile {
  id: string;
  book_id: string | null;
}

interface UserMembership {
  tier: "free" | "member" | "admin";
  status: "active" | "trialing" | "past_due" | "canceled" | "expired" | "suspended";
  starts_at: string;
  ends_at: string | null;
  provider: string | null;
  provider_subscription_id: string | null;
  auto_renew: boolean;
  canceled_at: string | null;
}

interface DashboardProfileResponse extends UserProfile {
  membership: UserMembership;
}

async function ensureBookId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  existingProfile: UserProfile | null
): Promise<UserProfile | null> {
  if (existingProfile?.book_id) {
    return existingProfile;
  }

  const nextBookId = crypto.randomUUID();
  const { data, error } = await supabase
    .from("user_profile")
    .upsert(
      {
        id: userId,
        book_id: nextBookId,
      },
      { onConflict: "id" }
    )
    .select("id,book_id")
    .single<UserProfile>();

  if (error) {
    return existingProfile;
  }

  return data ?? existingProfile;
}

export async function GET(request: NextRequest) {
  const accessToken = getBearerToken(request.headers.get("authorization"));
  const supabase = await createClient(accessToken || undefined);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: profile, error: profileError }, { data: membership, error: membershipError }] =
    await Promise.all([
      supabase
        .from("user_profile")
        .select("id,book_id")
        .eq("id", user.id)
        .maybeSingle<UserProfile>(),
      supabase
        .from("user_memberships")
        .select(
          "tier,status,starts_at,ends_at,provider,provider_subscription_id,auto_renew,canceled_at"
        )
        .eq("user_id", user.id)
        .maybeSingle<UserMembership>(),
    ]);

  if (profileError || membershipError) {
    return NextResponse.json({ error: GENERIC_REQUEST_ERROR }, { status: 500 });
  }

  const resolvedProfile = await ensureBookId(supabase, user.id, profile ?? null);

  const responseData: DashboardProfileResponse | null = resolvedProfile
    ? {
        ...resolvedProfile,
        membership: membership ?? {
          tier: "free",
          status: "active",
          starts_at: new Date().toISOString(),
          ends_at: null,
          provider: null,
          provider_subscription_id: null,
          auto_renew: false,
          canceled_at: null,
        },
      }
    : null;

  return NextResponse.json({ data: responseData });
}
