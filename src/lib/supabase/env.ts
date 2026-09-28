// Each variable is referenced literally so Next.js can inline the NEXT_PUBLIC_* ones into the
// browser bundle; the non-public fallbacks are undefined there and only apply on the server.
export function readSupabaseUrl(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.TS_SUPA_NEXT_PUBLIC_SUPABASE_URL ||
    process.env.TS_SUPA_SUPABASE_URL
  );
}

function readSupabaseKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.TS_SUPA_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.TS_SUPA_SUPABASE_ANON_KEY
  );
}

export const SUPABASE_URL_VARS =
  "NEXT_PUBLIC_SUPABASE_URL or TS_SUPA_NEXT_PUBLIC_SUPABASE_URL or TS_SUPA_SUPABASE_URL";

const SUPABASE_KEY_VARS =
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY or TS_SUPA_NEXT_PUBLIC_SUPABASE_ANON_KEY or TS_SUPA_SUPABASE_ANON_KEY";

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

/** Returns the URL and publishable key, or `null` when either is missing. */
export function findSupabaseConfig(): SupabaseConfig | null {
  const supabaseUrl = readSupabaseUrl();
  const supabaseKey = readSupabaseKey();

  return supabaseUrl && supabaseKey ? { supabaseUrl, supabaseKey } : null;
}

/** Returns the URL and publishable key, throwing with the missing variable names otherwise. */
export function getSupabaseConfig(): SupabaseConfig {
  const config = findSupabaseConfig();
  if (config) {
    return config;
  }

  const missing: string[] = [];
  if (!readSupabaseUrl()) {
    missing.push(SUPABASE_URL_VARS);
  }
  if (!readSupabaseKey()) {
    missing.push(SUPABASE_KEY_VARS);
  }

  throw new Error(`Missing Supabase environment variables: ${missing.join(", ")}`);
}
