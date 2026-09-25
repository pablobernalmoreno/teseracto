import { NextRequest, NextResponse } from "next/server";

// Legacy OAuth/magic-link callback path. The handler now lives at /api/auth/callback; this
// forwards the query string (code, next) unchanged so links and Supabase redirect URLs that
// still point here keep working. Remove once the Supabase Redirect URLs and email templates
// only reference /api/auth/callback.
export function GET(request: NextRequest) {
  const target = new URL("/api/auth/callback", request.nextUrl.origin);
  target.search = request.nextUrl.search;

  return NextResponse.redirect(target, 307);
}
