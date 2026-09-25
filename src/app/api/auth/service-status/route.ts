import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/env";

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
