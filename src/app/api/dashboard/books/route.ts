import { createClient } from "@/app/utils/supabase/server";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getClientIdentifier, takeRateLimit } from "@/app/utils/security/rateLimit";
import {
  GENERIC_REQUEST_ERROR,
  getBearerToken,
  isJsonContentType,
  normalizeBookIds,
  normalizeMainDataArray,
  parseTrimmedString,
} from "@/app/utils/security/validation";

interface UserProfile {
  book_id: string;
}

interface BookPreviewRpcRow {
  id: string;
  title: string;
  content: unknown[] | null;
  owner_id: string;
  creationTime: string;
  total_count: number;
}

function toBookPreview<T extends { content?: unknown }>(book: T): T {
  return {
    ...book,
    content: Array.isArray(book.content) ? book.content.slice(0, 3) : [],
  };
}

async function resolveOwnerId(request: NextRequest) {
  const accessToken = getBearerToken(request.headers.get("authorization"));
  const supabase = await createClient(accessToken || undefined);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return {
      supabase,
      ownerId: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profile")
    .select("book_id")
    .eq("id", user.id)
    .single<UserProfile>();

  if (profileError || !profile?.book_id) {
    return {
      supabase,
      ownerId: null,
      response: NextResponse.json({ error: "Profile not found" }, { status: 404 }),
    };
  }

  return {
    supabase,
    ownerId: profile.book_id,
    response: null,
  };
}

export async function GET(request: NextRequest) {
  const { supabase, ownerId, response } = await resolveOwnerId(request);
  if (response) {
    return response;
  }

  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const from = Number(searchParams.get("from") ?? 0);
  const to = Number(searchParams.get("to") ?? 0);
  const searchQuery = (searchParams.get("searchQuery") ?? "").trim();

  const safeFrom = Number.isFinite(from) && from >= 0 ? from : 0;
  const safeTo = Number.isFinite(to) && to >= safeFrom ? to : safeFrom;

  const { data: rpcData, error: rpcError } = await supabase.rpc("get_user_books_page_preview", {
    p_owner_id: ownerId,
    p_from: safeFrom,
    p_to: safeTo,
    p_search_query: searchQuery || null,
  });

  if (!rpcError && Array.isArray(rpcData)) {
    const rows = rpcData as BookPreviewRpcRow[];
    const count = rows[0]?.total_count ?? 0;

    return NextResponse.json({
      data: rows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content ?? [],
        owner_id: row.owner_id,
        creationTime: row.creationTime,
      })),
      count,
    });
  }

  let query = supabase
    .from("user_books")
    .select("id, title, content, owner_id, creationTime", { count: "exact" })
    .eq("owner_id", ownerId)
    .order("creationTime", { ascending: false })
    .order("id", { ascending: false })
    .range(safeFrom, safeTo);

  if (searchQuery) {
    const escaped = searchQuery.replaceAll(/[%_]/g, String.raw`\$&`);
    query = query.or(`title.ilike.%${escaped}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    const fallbackError = rpcError?.message || GENERIC_REQUEST_ERROR;
    return NextResponse.json({ error: fallbackError }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(toBookPreview), count: count ?? 0 });
}

export async function DELETE(request: NextRequest) {
  const rateLimit = takeRateLimit({
    key: `api:dashboard-books:delete:${getClientIdentifier(request.headers)}`,
    limit: 30,
    windowMs: 5 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const { supabase, ownerId, response } = await resolveOwnerId(request);
  if (response) {
    return response;
  }

  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isJsonContentType(request.headers.get("content-type"))) {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
  }

  const body = (await request.json().catch(() => null)) as { bookIds?: unknown } | null;
  const bookIds = normalizeBookIds(body?.bookIds);

  if (!bookIds) {
    return NextResponse.json({ error: "bookIds must be a non-empty array" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_books")
    .delete()
    .eq("owner_id", ownerId)
    .in("id", bookIds)
    .select("id");

  if (error) {
    return NextResponse.json({ error: GENERIC_REQUEST_ERROR }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const rateLimit = takeRateLimit({
    key: `api:dashboard-books:post:${getClientIdentifier(request.headers)}`,
    limit: 30,
    windowMs: 5 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const { supabase, ownerId, response } = await resolveOwnerId(request);
  if (response) {
    return response;
  }

  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isJsonContentType(request.headers.get("content-type"))) {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
  }

  const body = (await request.json().catch(() => null)) as {
    title?: unknown;
    content?: unknown;
    bookId?: unknown;
  } | null;

  const title = parseTrimmedString(body?.title, 180);
  const content = normalizeMainDataArray(body?.content);
  const requestedBookId = typeof body?.bookId === "string" ? body.bookId.trim() : undefined;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  if (!content) {
    return NextResponse.json({ error: "content must be an array" }, { status: 400 });
  }

  const bookId = requestedBookId || crypto.randomUUID();

  const { data, error } = await supabase
    .from("user_books")
    .insert([
      {
        id: bookId,
        owner_id: ownerId,
        title,
        content,
        creationTime: new Date().toISOString(),
      },
    ])
    .select("id, title, content, owner_id, creationTime")
    .single();

  if (error) {
    return NextResponse.json({ error: GENERIC_REQUEST_ERROR }, { status: 500 });
  }

  return NextResponse.json({ data });
}
