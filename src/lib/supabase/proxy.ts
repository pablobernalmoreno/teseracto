import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { findSupabaseConfig } from "./env";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/auth",
  "/account_confirmation",
  "/pricing",
  "/api/auth",
];

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" || PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  );
}

/**
 * Refreshes the Supabase session cookies so SSR pages always see a valid user, and redirects
 * anonymous visitors of private paths to /login. Public paths always pass through.
 */
export async function updateSession(
  request: NextRequest,
  requestHeaders: Headers
): Promise<NextResponse> {
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const config = findSupabaseConfig();

  // Fails closed for private paths: without auth config we cannot verify the user, so we refuse
  // with 503 rather than serve protected pages. Public paths fail open so the site stays reachable.
  if (!config) {
    if (!isPublicPath(request.nextUrl.pathname)) {
      return new NextResponse("Service Unavailable: auth misconfigured", { status: 503 });
    }
    return response;
  }

  const supabase = createServerClient(config.supabaseUrl, config.supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: do not add logic between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
