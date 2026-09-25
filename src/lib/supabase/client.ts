import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const { supabaseUrl, supabaseKey } = getSupabaseConfig();

    supabaseInstance = createBrowserClient(supabaseUrl, supabaseKey, {
      auth: {
        flowType: "pkce",
      },
    });
  }

  if (!supabaseInstance) {
    throw new Error("Failed to initialize Supabase client");
  }

  return supabaseInstance;
}

// Lazy-loaded instance
export default getSupabaseClient();
