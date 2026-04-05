import { createClient } from "@/app/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getClientIdentifier, takeRateLimit } from "@/app/utils/security/rateLimit";
import { GENERIC_REQUEST_ERROR, isJsonContentType } from "@/app/utils/security/validation";

interface SessionBody {
  access_token?: string;
  refresh_token?: string;
}

export async function POST(request: NextRequest) {
  const rateLimit = takeRateLimit({
    key: `api:auth-session:post:${getClientIdentifier(request.headers)}`,
    limit: 10,
    windowMs: 5 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  if (!isJsonContentType(request.headers.get("content-type"))) {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
  }

  const body = (await request.json().catch(() => null)) as SessionBody | null;
  const accessToken = body?.access_token?.trim();
  const refreshToken = body?.refresh_token?.trim();

  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { error: "access_token and refresh_token are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return NextResponse.json({ error: "Invalid session payload" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const rateLimit = takeRateLimit({
    key: `api:auth-session:delete:session-close`,
    limit: 30,
    windowMs: 5 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: GENERIC_REQUEST_ERROR }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
