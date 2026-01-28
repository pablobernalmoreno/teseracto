import supabase from "@/config/supabaseClient";
import crypto from "crypto";

export interface UserData {
  id: string;
  book_id: string;
}

export interface BookData {
  id: string;
  title: string;
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
    return await supabase.from("user_books").select();
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
