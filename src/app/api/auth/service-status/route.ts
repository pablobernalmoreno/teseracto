import { NextResponse } from "next/server";

function getSupabaseConfig(): { supabaseUrl: string; supabaseKey: string } {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.TS_SUPA_NEXT_PUBLIC_SUPABASE_URL ||
    process.env.TS_SUPA_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.TS_SUPA_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.TS_SUPA_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return { supabaseUrl, supabaseKey };
}

function isPausedResponse(body: string): boolean {
  const normalized = body.toLowerCase();
  return normalized.includes("project paused") || normalized.includes("please unpause");
}

export async function GET() {
  let supabaseUrl: string;
  let supabaseKey: string;

  try {
    ({ supabaseUrl, supabaseKey } = getSupabaseConfig());
  } catch {
    return NextResponse.json({ available: false }, { status: 503 });
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
      },
      cache: "no-store",
      next: { revalidate: 0 },
    });

    const text = await response.text();
    const available = response.ok && !isPausedResponse(text);

    return NextResponse.json(
      { available },
      {
        status: available ? 200 : 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { available: false },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
