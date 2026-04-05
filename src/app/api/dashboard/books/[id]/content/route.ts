import { createClient } from "@/app/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getClientIdentifier, takeRateLimit } from "@/app/utils/security/rateLimit";
import {
  GENERIC_REQUEST_ERROR,
  getBearerToken,
  isJsonContentType,
  normalizeMainDataArray,
} from "@/app/utils/security/validation";

interface UserProfile {
  book_id: string;
}

interface SupabaseErrorLike {
  code?: string;
  message?: string;
}

function isNoRowsError(error: SupabaseErrorLike | null): boolean {
  return error?.code === "PGRST116";
}

async function resolveOwnerId(request: NextRequest) {
  const accessToken = getBearerToken(request.headers.get("authorization"));
  const supabase = await createClient(accessToken || undefined);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return {
      supabase,
      ownerId: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profile")
    .select("book_id")
    .eq("id", user.id)
    .single<UserProfile>();

  if (profileError || !profile?.book_id) {
    return {
      supabase,
      ownerId: null,
      response: NextResponse.json({ error: "Profile not found" }, { status: 404 }),
    };
  }

  return {
    supabase,
    ownerId: profile.book_id,
    response: null,
  };
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { supabase, ownerId, response } = await resolveOwnerId(_request);
  if (response) {
    return response;
  }

  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from("user_books")
    .select("content")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .single();

  if (error) {
    if (isNoRowsError(error)) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json({ error: GENERIC_REQUEST_ERROR }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const rateLimit = takeRateLimit({
    key: `api:dashboard-book-content:patch:${getClientIdentifier(request.headers)}`,
    limit: 30,
    windowMs: 5 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const { supabase, ownerId, response } = await resolveOwnerId(request);
  if (response) {
    return response;
  }

  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isJsonContentType(request.headers.get("content-type"))) {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
  }

  const body = (await request.json().catch(() => null)) as { content?: unknown } | null;
  const content = normalizeMainDataArray(body?.content);

  if (!content) {
    return NextResponse.json({ error: "content must be an array" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_books")
    .update({ content })
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select()
    .single();

  if (error) {
    if (isNoRowsError(error)) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json({ error: GENERIC_REQUEST_ERROR }, { status: 500 });
  }

  return NextResponse.json({ data });
}
