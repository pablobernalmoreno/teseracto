import { createClient } from "@/app/utils/supabase/server";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

interface UserProfile {
  book_id: string;
}

function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();
  return token || null;
}

async function resolveOwnerId(request: NextRequest) {
  const accessToken = getBearerToken(request);
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
  if (response || !ownerId) {
    return response;
  }

  const searchParams = request.nextUrl.searchParams;
  const from = Number(searchParams.get("from") ?? 0);
  const to = Number(searchParams.get("to") ?? 0);
  const searchQuery = (searchParams.get("searchQuery") ?? "").trim();

  const safeFrom = Number.isFinite(from) && from >= 0 ? from : 0;
  const safeTo = Number.isFinite(to) && to >= safeFrom ? to : safeFrom;

  let query = supabase
    .from("user_books")
    .select("*", { count: "exact" })
    .eq("owner_id", ownerId)
    .order("creationTime", { ascending: false })
    .order("id", { ascending: false })
    .range(safeFrom, safeTo);

  if (searchQuery) {
    const escaped = searchQuery.replaceAll(/[%_]/g, String.raw`\$&`);
    query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [], count: count ?? 0 });
}

export async function DELETE(request: NextRequest) {
  const { supabase, ownerId, response } = await resolveOwnerId(request);
  if (response || !ownerId) {
    return response;
  }

  const body = (await request.json().catch(() => null)) as {
    bookIds?: Array<string | number>;
  } | null;

  const bookIds = body?.bookIds;

  if (!Array.isArray(bookIds) || bookIds.length === 0) {
    return NextResponse.json({ error: "bookIds must be a non-empty array" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_books")
    .delete()
    .eq("owner_id", ownerId)
    .in("id", bookIds)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { supabase, ownerId, response } = await resolveOwnerId(request);
  if (response || !ownerId) {
    return response;
  }

  const body = (await request.json().catch(() => null)) as {
    title?: string;
    content?: unknown[];
    bookId?: string;
  } | null;

  const title = body?.title?.trim() || "";
  const content = body?.content;
  const requestedBookId = body?.bookId?.trim();

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  if (!Array.isArray(content)) {
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
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
