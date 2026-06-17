import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

function getSupabaseServerConfig(): { supabaseUrl: string; supabaseKey: string } {
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
    const missing: string[] = [];
    if (!supabaseUrl) {
      missing.push(
        "NEXT_PUBLIC_SUPABASE_URL or TS_SUPA_NEXT_PUBLIC_SUPABASE_URL or TS_SUPA_SUPABASE_URL"
      );
    }
    if (!supabaseKey) {
      missing.push(
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY or TS_SUPA_NEXT_PUBLIC_SUPABASE_ANON_KEY or TS_SUPA_SUPABASE_ANON_KEY"
      );
    }

    throw new Error(`Missing Supabase environment variables: ${missing.join(", ")}`);
  }

  return { supabaseUrl, supabaseKey };
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next");
  const destination = nextPath?.startsWith("/") ? nextPath : "/main";

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/callback/error?reason=missing_code", requestUrl.origin)
    );
  }

  const redirectResponse = NextResponse.redirect(new URL(destination, requestUrl.origin));

  let supabaseUrl: string;
  let supabaseKey: string;
  try {
    ({ supabaseUrl, supabaseKey } = getSupabaseServerConfig());
  } catch {
    return NextResponse.redirect(
      new URL("/auth/callback/error?reason=oauth_callback", requestUrl.origin)
    );
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/auth/callback/error?reason=oauth_callback", requestUrl.origin)
    );
  }

  return redirectResponse;
}
