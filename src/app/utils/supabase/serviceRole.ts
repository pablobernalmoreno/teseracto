import { createClient } from "@supabase/supabase-js";

interface SupabaseServiceConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
}

const getSupabaseServiceConfig = (): SupabaseServiceConfig => {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.TS_SUPA_NEXT_PUBLIC_SUPABASE_URL ||
    process.env.TS_SUPA_SUPABASE_URL;

  const serviceRoleKey =
    process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.TS_SUPA_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    const missing: string[] = [];

    if (!supabaseUrl) {
      missing.push(
        "NEXT_PUBLIC_SUPABASE_URL or TS_SUPA_NEXT_PUBLIC_SUPABASE_URL or TS_SUPA_SUPABASE_URL"
      );
    }

    if (!serviceRoleKey) {
      missing.push(
        "NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY or TS_SUPA_SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    throw new Error(`Missing Supabase service role configuration: ${missing.join(", ")}`);
  }

  return {
    supabaseUrl,
    serviceRoleKey,
  };
};

export const createServiceRoleClient = () => {
  const { supabaseUrl, serviceRoleKey } = getSupabaseServiceConfig();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
