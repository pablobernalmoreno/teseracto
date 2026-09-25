import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { getSafeAuthRedirectPath } from "@/lib/auth/redirect";

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
    ({ supabaseUrl, supabaseKey } = getSupabaseConfig());
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
