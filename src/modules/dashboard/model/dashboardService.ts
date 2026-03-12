import supabase from "@/config/supabaseClient";
import crypto from "crypto";
import type { MainData } from "./useItemCardModel";

export interface UserData {
  id: string;
  book_id: string;
}

export interface BookData {
  id: string;
  title: string;
  content?: MainData[];
  description?: string;
  owner_id?: string;
  creationTime?: string;
}

interface FetchBookDataPageParams {
  ownerId: string;
  from: number;
  to: number;
  searchQuery?: string;
}

// Dashboard service object with separate functions
export const dashboardService = {
  async getSession() {
    return await supabase.auth.getSession();
  },

  async fetchUserData() {
    return await supabase.from("user_profile").select();
  },

  async fetchCurrentUserProfile() {
    const {
      data: { session },
      error: sessionError,
    } = await this.getSession();

    if (sessionError || !session?.user?.id) {
      return { data: null, error: sessionError };
    }

    return await supabase
      .from("user_profile")
      .select("id,book_id")
      .eq("id", session.user.id)
      .single();
  },

  async fetchBookDataPage({
    ownerId,
    from,
    to,
    searchQuery,
  }: FetchBookDataPageParams) {
    let query = supabase
      .from("user_books")
      .select("*", {
        count: "exact",
      })
      .eq("owner_id", ownerId)
      .order("creationTime", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    const trimmedQuery = searchQuery?.trim();
    if (trimmedQuery) {
      const escaped = trimmedQuery.replace(/[%_]/g, "\\$&");
      query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`);
    }

    return await query;
  },

  // Fetch full content for a single book by id (used for lazy-loading)
  async fetchBookContent(bookId: string | number) {
    return await supabase
      .from("user_books")
      .select("content")
      .eq("id", bookId)
      .single();
  },

  async deleteBooks(bookIds: Array<string | number>) {
    return await supabase.from("user_books").delete().in("id", bookIds);
  },

  async insertBookData(
    bookId: string,
    ownerId: string,
    title: string,
    content: MainData[],
  ) {
    return await supabase
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
      .select();
  },

  async updateBookContent(bookId: string | number, content: MainData[]) {
    return await supabase
      .from("user_books")
      .update({ content })
      .eq("id", bookId)
      .select()
      .single();
  },

  async createUserProfile(userId: string) {
    const uuid = crypto.randomUUID();
    return await supabase
      .from("user_profile")
      .insert([{ id: userId, book_id: uuid }])
      .select();
  },

  async initializeUserProfile(
    sessionData: { session?: { user?: { role?: string; id?: string } } } | null,
    userData: unknown[] | null | undefined,
  ) {
    const user = sessionData?.session?.user;
    if (user?.role === "authenticated" && user?.id && userData?.length === 0) {
      return await this.createUserProfile(user.id);
    }
  },
};
