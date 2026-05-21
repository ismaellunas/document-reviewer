/**
 * Repository for the `gewci_users` profile table. Pure data access -- no
 * business rules, no auth assumptions. Callers (services) decide what to
 * do with `null` results.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { GEWCIUser } from "@/lib/types";

export const usersRepo = {
  async findById(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<GEWCIUser | null> {
    const { data, error } = await supabase
      .from("gewci_users")
      .select("id, email, display_name, avatar_url, roles, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle<GEWCIUser>();

    if (error) {
      console.error("usersRepo.findById error:", { userId, error });
      return null;
    }
    return data;
  },

  async getRoles(
    supabase: SupabaseClient,
    userId: string,
  ): Promise<string[]> {
    const { data, error } = await supabase
      .from("gewci_users")
      .select("roles")
      .eq("id", userId)
      .maybeSingle<{ roles: string[] | null }>();

    if (error) {
      console.error("usersRepo.getRoles error:", { userId, error });
      return [];
    }
    return data?.roles ?? [];
  },
};
