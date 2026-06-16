import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseURL =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.TS_SUPA_NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.TS_SUPA_NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseURL || !supabaseAnonKey) {
      const missing: string[] = [];
      if (!supabaseURL) {
        missing.push("NEXT_PUBLIC_SUPABASE_URL or TS_SUPA_NEXT_PUBLIC_SUPABASE_URL");
      }
      if (!supabaseAnonKey) {
        missing.push(
          "NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or TS_SUPA_NEXT_PUBLIC_SUPABASE_ANON_KEY"
        );
      }

      throw new Error(`Missing Supabase environment variables: ${missing.join(", ")}`);
    }

    supabaseInstance = createClient(supabaseURL, supabaseAnonKey);
  }
  return supabaseInstance;
}

// Lazy-loaded instance
export default getSupabaseClient();
