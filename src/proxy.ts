import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

function buildCsp(nonce: string, allowUnsafeEval: boolean): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'wasm-unsafe-eval'",
    "blob:",
    "https://cdn.jsdelivr.net",
    "https://checkout.wompi.co",
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
    `script-src-elem 'self' 'nonce-${nonce}' blob: https://cdn.jsdelivr.net https://checkout.wompi.co`,
    "worker-src 'self' blob:",
    "child-src 'self' blob: https://checkout.wompi.co https://*.wompi.co",
    "frame-src 'self' https://checkout.wompi.co https://*.wompi.co",
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

  const response = await updateSession(request, requestHeaders);
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
