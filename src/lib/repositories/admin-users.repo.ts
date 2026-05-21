import "server-only";

import type { User } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import type { GEWCIUser } from "@/lib/types";

/**
 * Service-role-only repository. The only file in the codebase that
 * imports `lib/supabase/admin.ts` and therefore the only file allowed
 * to bypass RLS. Two responsibilities:
 *
 *   1. Wrap the Supabase Auth Admin SDK (`auth.admin.*`) for operations
 *      against `auth.users` (createUser, deleteUser, listUsers).
 *   2. Provide RLS-bypassing writes to `public.gewci_users` for admin
 *      user management. Regular `usersRepo` writes are RLS-scoped to
 *      `auth.uid() = id`, which makes cross-user admin updates silently
 *      return zero rows. Routing those writes through here avoids the
 *      need for a parallel "admin can update any user" RLS policy.
 *
 * The functions here are intentionally low-level. Business rules
 * (permission checks, audit logging, self-protection) live in
 * `lib/services/users.service.ts`.
 */

interface CreateUserInput {
  email: string;
  password: string;
  display_name: string;
}

export const adminUsersRepo = {
  /**
   * Create a confirmed auth user. `email_confirm: true` bypasses the
   * email-verification step on a per-user basis, so the new account can
   * sign in immediately with the supplied password regardless of the
   * project-wide "Confirm email" setting.
   */
  async createUser(input: CreateUserInput): Promise<User> {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        display_name: input.display_name,
      },
    });

    if (error || !data?.user) {
      throw new Error(
        `adminUsersRepo.createUser: ${error?.message ?? "no user returned"}`,
      );
    }
    return data.user;
  },

  async deleteUser(userId: string): Promise<void> {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      throw new Error(`adminUsersRepo.deleteUser: ${error.message}`);
    }
  },

  /**
   * Fetch every auth user (paginated). The page size is capped at 1000
   * by Supabase; for our small-org use case a single page is plenty and
   * we collapse pagination into a single array.
   */
  async listAll(): Promise<User[]> {
    const admin = createAdminClient();
    const collected: User[] = [];
    const perPage = 200;
    let page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) {
        throw new Error(`adminUsersRepo.listAll: ${error.message}`);
      }
      const users = data?.users ?? [];
      collected.push(...users);
      if (users.length < perPage) break;
      page += 1;
      // Hard safety limit -- 5,000 users is well beyond the church's needs
      // and keeps a misconfigured pagination response from looping forever.
      if (page > 25) break;
    }
    return collected;
  },

  /**
   * Update the `roles` column on a gewci_users row, bypassing RLS. Used
   * by the admin user management flow because the standard
   * `users_update_own` policy rejects cross-user updates.
   */
  async setProfileRoles(
    userId: string,
    roles: string[],
  ): Promise<GEWCIUser> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("gewci_users")
      .update({ roles, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single<GEWCIUser>();

    if (error || !data) {
      throw new Error(
        `adminUsersRepo.setProfileRoles: ${error?.message ?? "no row returned"}`,
      );
    }
    return data;
  },

  /**
   * Update the `display_name` column on a gewci_users row, bypassing RLS.
   * See `setProfileRoles` for the rationale.
   */
  async setProfileDisplayName(
    userId: string,
    displayName: string,
  ): Promise<GEWCIUser> {
    const admin = createAdminClient();
    const { data, error } = await admin
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
        `adminUsersRepo.setProfileDisplayName: ${error?.message ?? "no row returned"}`,
      );
    }
    return data;
  },
};
