import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getSafeAuthRedirectPath } from "./redirect";

function buildErrorCallbackUrl(
  requestUrl: URL,
  reason: "missing_code" | "oauth_callback" | "service_unavailable",
  destination: string
): URL {
  const url = new URL("/auth/callback/error", requestUrl.origin);
  url.searchParams.set("reason", reason);
  url.searchParams.set("next", destination);
  return url;
}

function isLikelyServiceUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as {
    status?: number;
    message?: string;
    name?: string;
    cause?: { message?: string };
  };

  if (maybeError.status === 503 || maybeError.status === 504) {
    return true;
  }

  const combinedMessage = [maybeError.message, maybeError.name, maybeError.cause?.message]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .toLowerCase();

  return (
    combinedMessage.includes("fetch failed") ||
    combinedMessage.includes("network") ||
    combinedMessage.includes("timeout") ||
    combinedMessage.includes("temporarily unavailable") ||
    combinedMessage.includes("unavailable") ||
    combinedMessage.includes("paused")
  );
}

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
  const destination = getSafeAuthRedirectPath(nextPath);

  if (!code) {
    return NextResponse.redirect(buildErrorCallbackUrl(requestUrl, "missing_code", destination));
  }

  const redirectResponse = NextResponse.redirect(new URL(destination, requestUrl.origin));

  let supabaseUrl: string;
  let supabaseKey: string;
  try {
    ({ supabaseUrl, supabaseKey } = getSupabaseServerConfig());
  } catch {
    return NextResponse.redirect(buildErrorCallbackUrl(requestUrl, "oauth_callback", destination));
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
    const reason = isLikelyServiceUnavailableError(error)
      ? "service_unavailable"
      : "oauth_callback";

    return NextResponse.redirect(buildErrorCallbackUrl(requestUrl, reason, destination));
  }

  return redirectResponse;
}
