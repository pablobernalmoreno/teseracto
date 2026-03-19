import { createClient } from "@/app/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface SessionBody {
  access_token?: string;
  refresh_token?: string;
}

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
