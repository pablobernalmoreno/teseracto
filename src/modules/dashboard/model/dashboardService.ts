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

// Dashboard service object with separate functions
export const dashboardService = {
  async getSession() {
    return await supabase.auth.getSession();
  },

  async fetchUserData() {
    return await supabase.from("user_profile").select();
  },

  async fetchBookData() {
    return await supabase
      .from("user_books")
      .select()
      .order("creationTime", { ascending: false })
      .order("id", { ascending: false });
  },

  // Fetch full content for a single book by id (used for lazy-loading)
  async fetchBookContent(bookId: string | number) {
    return await supabase
      .from("user_books")
      .select("content")
      .eq("id", bookId)
      .single();
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

  async createUserProfile(userId: string) {
    const uuid = crypto.randomUUID();
    return await supabase
      .from("user_profile")
      .insert([{ id: userId, book_id: uuid }])
      .select();
  },

  async initializeUserProfile(sessionData: any, userData: any) {
    if (
      sessionData.session?.user.role === "authenticated" &&
      userData?.length === 0
    ) {
      return await this.createUserProfile(sessionData?.session?.user.id);
    }
  },
};
