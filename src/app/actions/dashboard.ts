"use server";

import { createClient } from "@/app/utils/supabase/server";
import { headers } from "next/headers";
import { cacheLife, cacheTag, updateTag } from "next/cache";
import type { MainData } from "@/types/dashboard";
import { getClientIdentifier, takeRateLimit } from "@/app/utils/security/rateLimit";
import {
  normalizeBookIds,
  normalizeMainDataArray,
  parseTrimmedString,
} from "@/app/utils/security/validation";

export interface BookData {
  id: string;
  title: string;
  content?: MainData[];
  owner_id?: string;
  creationTime?: string;
}

export interface UserProfile {
  id: string;
  book_id: string;
}

interface BookPreviewRpcRow {
  id: string;
  title: string;
  content: MainData[] | null;
  owner_id: string;
  creationTime: string;
  total_count: number;
}

function toBookPreview(book: BookData): BookData {
  return {
    ...book,
    content: Array.isArray(book.content) ? book.content.slice(0, 3) : [],
  };
}

interface DashboardActionContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  ownerBookId: string | null;
  error: string | null;
}

const booksTag = (ownerBookId: string) => `dashboard-books:${ownerBookId}`;
const bookTag = (bookId: string) => `dashboard-book:${bookId}`;

const MAX_ITEMS_PER_PAGE = 100;

function normalizeItemsPerPage(itemsPerPage: number): number {
  const safeItemsPerPage = Number.isFinite(itemsPerPage) ? Math.trunc(itemsPerPage) : 5;
  return Math.min(Math.max(safeItemsPerPage, 1), MAX_ITEMS_PER_PAGE);
}

function normalizePage(page: number): number {
  const safePage = Number.isFinite(page) ? Math.trunc(page) : 0;
  return Math.max(safePage, 0);
}

async function isMutationRateLimited(namespace: string) {
  const requestHeaders = await headers();
  const clientId = getClientIdentifier(requestHeaders);
  return takeRateLimit({
    key: `${namespace}:${clientId}`,
    limit: 30,
    windowMs: 5 * 60 * 1000,
  });
}

async function getDashboardActionContext(): Promise<DashboardActionContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { supabase, ownerBookId: null, error: "Unauthorized" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profile")
    .select("book_id")
    .eq("id", user.id)
    .single<UserProfile>();

  if (profileError || !profile?.book_id) {
    return { supabase, ownerBookId: null, error: "Profile not found" };
  }

  return { supabase, ownerBookId: profile.book_id, error: null };
}

async function fetchBooksPageCached(
  ownerBookId: string,
  page: number,
  searchQuery: string,
  itemsPerPage: number
) {
  "use cache: private";

  cacheLife("minutes");
  cacheTag("dashboard-books", booksTag(ownerBookId));

  const supabase = await createClient();

  const from = page * itemsPerPage;
  const to = from + itemsPerPage - 1;

  const { data: rpcData, error: rpcError } = await supabase.rpc("get_user_books_page_preview", {
    p_owner_id: ownerBookId,
    p_from: from,
    p_to: to,
    p_search_query: searchQuery.trim() || null,
  });

  if (!rpcError && Array.isArray(rpcData)) {
    const rows = rpcData as BookPreviewRpcRow[];
    const count = rows[0]?.total_count ?? 0;

    return {
      data: rows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content ?? [],
        owner_id: row.owner_id,
        creationTime: row.creationTime,
      })),
      count,
      error: null,
    };
  }

  let query = supabase
    .from("user_books")
    .select("id, title, content, owner_id, creationTime", { count: "exact" })
    .eq("owner_id", ownerBookId)
    .order("creationTime", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (searchQuery.trim()) {
    const escaped = searchQuery.trim().replaceAll(/[%_]/g, String.raw`\$&`);
    query = query.or(`title.ilike.%${escaped}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    const fallbackError = rpcError?.message || error.message;
    return { data: null, count: 0, error: fallbackError };
  }

  return {
    data: ((data ?? []) as BookData[]).map(toBookPreview),
    count: count ?? 0,
    error: null,
  };
}

async function fetchBookContentCached(bookId: string, ownerId: string) {
  "use cache: private";

  cacheLife("minutes");
  cacheTag("dashboard-book", bookTag(bookId));

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_books")
    .select("content")
    .eq("id", bookId)
    .eq("owner_id", ownerId)
    .single<BookData>();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function fetchBooksPage(page: number, searchQuery: string, itemsPerPage: number = 5) {
  const context = await getDashboardActionContext();
  if (context.error || !context.ownerBookId) {
    return { data: null, count: 0, error: context.error ?? "Unauthorized" };
  }

  return fetchBooksPageCached(
    context.ownerBookId,
    normalizePage(page),
    searchQuery,
    normalizeItemsPerPage(itemsPerPage)
  );
}

export async function fetchBookContent(bookId: string) {
  const trimmedBookId = bookId.trim();
  if (!trimmedBookId) {
    return { data: null, error: "Invalid book id" };
  }

  const context = await getDashboardActionContext();
  if (context.error || !context.ownerBookId) {
    return { data: null, error: context.error ?? "Unauthorized" };
  }

  return fetchBookContentCached(trimmedBookId, context.ownerBookId);
}

export async function deleteBooks(bookIds: (string | number)[]) {
  const mutationRateLimit = await isMutationRateLimited("dashboard:delete-books");
  if (!mutationRateLimit.allowed) {
    return { data: null, error: "Demasiadas solicitudes. Intenta nuevamente más tarde." };
  }

  const normalizedBookIds = normalizeBookIds(bookIds);
  if (!normalizedBookIds) {
    return { data: null, error: "No books selected" };
  }

  const context = await getDashboardActionContext();
  if (context.error || !context.ownerBookId) {
    return { data: null, error: context.error ?? "Unauthorized" };
  }

  const { data, error } = await context.supabase
    .from("user_books")
    .delete()
    .eq("owner_id", context.ownerBookId)
    .in("id", normalizedBookIds)
    .select();

  if (error) {
    return { data: null, error: error.message };
  }

  updateTag("dashboard-books");
  updateTag(booksTag(context.ownerBookId));
  for (const id of normalizedBookIds) {
    updateTag(bookTag(id));
  }

  return { data: data ?? [], error: null };
}

export async function createBook(title: string, content: MainData[], bookId?: string) {
  const mutationRateLimit = await isMutationRateLimited("dashboard:create-book");
  if (!mutationRateLimit.allowed) {
    return { data: null, error: "Demasiadas solicitudes. Intenta nuevamente más tarde." };
  }

  const context = await getDashboardActionContext();
  if (context.error || !context.ownerBookId) {
    return { data: null, error: context.error ?? "Unauthorized" };
  }

  const normalizedTitle = title.trim();
  const normalizedContent = normalizeMainDataArray(content);
  const trimmedBookId = bookId?.trim();
  if (bookId !== undefined && !trimmedBookId) {
    return { data: null, error: "Invalid book id" };
  }

  if (normalizedTitle.length > 180) {
    return { data: null, error: "Invalid title" };
  }

  if (!normalizedContent) {
    return { data: null, error: "Invalid content payload" };
  }

  const operation = trimmedBookId
    ? context.supabase
        .from("user_books")
        .update({
          title: normalizedTitle,
          content: normalizedContent,
        })
        .eq("id", trimmedBookId)
        .eq("owner_id", context.ownerBookId)
        .select()
        .single()
    : context.supabase
        .from("user_books")
        .insert({
          title:
            parseTrimmedString(normalizedTitle || "Libro sin título", 180) || "Libro sin título",
          content: normalizedContent,
          owner_id: context.ownerBookId,
        })
        .select()
        .single();

  const { data, error } = await operation;

  if (error) {
    return { data: null, error: error.message };
  }

  updateTag("dashboard-books");
  updateTag(booksTag(context.ownerBookId));
  if (trimmedBookId) {
    updateTag(bookTag(trimmedBookId));
  }
  if (data?.id) {
    updateTag(bookTag(String(data.id)));
  }

  return { data: data as BookData, error: null };
}
