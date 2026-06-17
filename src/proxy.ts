import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

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

function buildCsp(nonce: string, allowUnsafeEval: boolean): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'wasm-unsafe-eval'",
    "blob:",
    "https://cdn.jsdelivr.net",
  ];

  if (allowUnsafeEval) {
    scriptSrc.push("'unsafe-eval'");
  }

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    `script-src-elem 'self' 'nonce-${nonce}' blob: https://cdn.jsdelivr.net`,
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    // Keep styles compatible with MUI while scripts are strictly nonce-based.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https: wss:",
  ];

  if (!allowUnsafeEval) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

export async function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  // Refresh the Supabase session so SSR pages always see a valid user
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.TS_SUPA_NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.TS_SUPA_NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  if (!supabaseUrl || !supabaseKey) {
    if (!isPublicPath(request.nextUrl.pathname)) {
      return new NextResponse("Service Unavailable: auth misconfigured", { status: 503 });
    }
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
  }

  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
