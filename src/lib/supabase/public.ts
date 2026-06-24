import { createClient } from "@supabase/supabase-js";

/**
 * Anonymous Supabase client for public library reads. RLS restricts
 * unauthenticated access to approved documents only.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(url, anonKey);
}
