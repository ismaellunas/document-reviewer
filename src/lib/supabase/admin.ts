import "server-only";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase **service role** client. Bypasses ALL RLS and exposes the
 * `auth.admin.*` API (createUser / deleteUser / updateUserById / listUsers).
 *
 * Security invariants -- enforced by code review:
 *   - Imports of this file are forbidden in any client component
 *     (`"use client"`). The `import "server-only"` line above turns any
 *     such import into a build-time error.
 *   - Only `lib/repositories/admin-users.repo.ts` should call this. Other
 *     modules go through the regular request-scoped client in `server.ts`.
 *   - Never logs the key, never includes it in error messages, never sends
 *     it to the browser. It is intentionally NOT prefixed with
 *     `NEXT_PUBLIC_*` so Next.js refuses to inline it client-side.
 *
 * If `SUPABASE_SERVICE_ROLE_KEY` is missing the function throws -- the
 * admin features are simply unavailable until the env var is present.
 * That keeps unrelated code paths (login, document review, etc.) working
 * even on a partially-configured environment.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to your environment to enable admin features.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
