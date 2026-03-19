import { createClient } from "@supabase/supabase-js";

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseURL || !supabaseAnonKey) {
  const missing: string[] = [];
  if (!supabaseURL) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!supabaseAnonKey) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  throw new Error(`Missing Supabase environment variables: ${missing.join(", ")}`);
}

const supabase = createClient(supabaseURL, supabaseAnonKey);

export default supabase;
