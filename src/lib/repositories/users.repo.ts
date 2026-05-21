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

  /**
   * List every profile, ordered alphabetically. Used by the admin user
   * management page. Pagination is intentionally simple (full list +
   * client-side filter) because the org is small; if it grows past a few
   * hundred users we can swap in `range()` here.
   */
  async list(supabase: SupabaseClient): Promise<GEWCIUser[]> {
    const { data, error } = await supabase
      .from("gewci_users")
      .select("id, email, display_name, avatar_url, roles, created_at, updated_at")
      .order("display_name", { ascending: true })
      .returns<GEWCIUser[]>();

    if (error) {
      throw new Error(`usersRepo.list: ${error.message}`);
    }
    return data ?? [];
  },

  async updateRoles(
    supabase: SupabaseClient,
    userId: string,
    roles: string[],
  ): Promise<GEWCIUser> {
    const { data, error } = await supabase
      .from("gewci_users")
      .update({ roles, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single<GEWCIUser>();

    if (error || !data) {
      throw new Error(
        `usersRepo.updateRoles: ${error?.message ?? "no row returned"}`,
      );
    }
    return data;
  },

  async updateDisplayName(
    supabase: SupabaseClient,
    userId: string,
    displayName: string,
  ): Promise<GEWCIUser> {
    const { data, error } = await supabase
      .from("gewci_users")
      .update({
        display_name: displayName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single<GEWCIUser>();

    if (error || !data) {
      throw new Error(
        `usersRepo.updateDisplayName: ${error?.message ?? "no row returned"}`,
      );
    }
    return data;
  },

  /**
   * Count how many users currently have the admin role. Used for the
   * "don't delete the last admin" sanity check in the users service.
   */
  async countAdmins(supabase: SupabaseClient): Promise<number> {
    const { count, error } = await supabase
      .from("gewci_users")
      .select("*", { count: "exact", head: true })
      .contains("roles", ["document-review:admin"]);

    if (error) {
      console.error("usersRepo.countAdmins error:", error);
      return 0;
    }
    return count ?? 0;
  },
};
