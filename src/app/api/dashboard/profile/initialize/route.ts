import { createClient } from "@/app/utils/supabase/server";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getClientIdentifier, takeRateLimit } from "@/app/utils/security/rateLimit";
import { GENERIC_REQUEST_ERROR, getBearerToken } from "@/app/utils/security/validation";

export async function POST(request: NextRequest) {
  const rateLimit = takeRateLimit({
    key: `api:dashboard-profile-initialize:post:${getClientIdentifier(request.headers)}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const accessToken = getBearerToken(request.headers.get("authorization"));
  const supabase = await createClient(accessToken || undefined);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existingProfile, error: existingError } = await supabase
    .from("user_profile")
    .select("id,book_id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: GENERIC_REQUEST_ERROR }, { status: 500 });
  }

  if (existingProfile) {
    return NextResponse.json({ data: existingProfile, created: false });
  }

  const { data, error } = await supabase
    .from("user_profile")
    .insert([
      {
        id: user.id,
        book_id: crypto.randomUUID(),
      },
    ])
    .select("id,book_id")
    .single();

  if (error) {
    return NextResponse.json({ error: GENERIC_REQUEST_ERROR }, { status: 500 });
  }

  return NextResponse.json({ data, created: true });
}
