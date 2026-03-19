import { createClient } from "@/app/utils/supabase/server";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();
  return token || null;
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
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
    return NextResponse.json({ error: existingError.message }, { status: 500 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, created: true });
}
