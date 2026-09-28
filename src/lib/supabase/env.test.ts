import { findSupabaseConfig, getSupabaseConfig } from "./env";

const SUPABASE_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "TS_SUPA_NEXT_PUBLIC_SUPABASE_URL",
  "TS_SUPA_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "TS_SUPA_NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "TS_SUPA_SUPABASE_ANON_KEY",
];

describe("supabase env", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    SUPABASE_VARS.forEach((name) => delete process.env[name]);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("prefers the public variables", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.supabase.co";
    process.env.TS_SUPA_SUPABASE_URL = "https://fallback.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";

    expect(getSupabaseConfig()).toEqual({
      supabaseUrl: "https://public.supabase.co",
      supabaseKey: "publishable",
    });
  });

  it("falls back past empty variables", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.TS_SUPA_SUPABASE_URL = "https://fallback.supabase.co";
    process.env.TS_SUPA_SUPABASE_ANON_KEY = "server-anon";

    expect(findSupabaseConfig()).toEqual({
      supabaseUrl: "https://fallback.supabase.co",
      supabaseKey: "server-anon",
    });
  });

  it("returns null or throws naming only the missing variable when config is incomplete", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.supabase.co";

    expect(findSupabaseConfig()).toBeNull();
    expect(() => getSupabaseConfig()).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
    expect(() => getSupabaseConfig()).not.toThrow(/NEXT_PUBLIC_SUPABASE_URL or/);
  });
});
