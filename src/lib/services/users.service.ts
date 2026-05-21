/**
 * User management service. The only entry point for admin-managed user
 * lifecycle: list, invite, update, delete.
 *
 * Self-protection invariants:
 *   - An admin cannot remove their own admin role
 *   - An admin cannot delete themselves
 *   - The last admin in the system cannot be demoted or deleted
 *
 * Every mutation is audit-logged.
 */

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/errors";
import type { RequestContext } from "@/lib/http";
import {
  InviteUserSchema,
  UpdateUserSchema,
  type InviteUserInput,
  type UpdateUserInput,
} from "@/lib/schemas/users";
import { ROLE_ADMIN } from "@/lib/auth/roles";
import { adminUsersRepo } from "@/lib/repositories/admin-users.repo";
import { usersRepo } from "@/lib/repositories/users.repo";
import { auditService } from "@/lib/services/audit.service";
import { permissionsService } from "@/lib/services/permissions.service";
import type { AdminUserView, GEWCIUser } from "@/lib/types";

interface ServiceCallOptions {
  request?: Request;
}

export const usersService = {
  /**
   * Combined view of every user in the org. Merges `gewci_users`
   * (display name, roles) with `auth.users` (last sign-in, email
   * confirmation) so the admin UI gets a single denormalized list.
   */
  async list(ctx: RequestContext): Promise<AdminUserView[]> {
    await permissionsService.requireAdmin(ctx);

    const [profiles, authUsers] = await Promise.all([
      usersRepo.list(ctx.supabase),
      adminUsersRepo.listAll(),
    ]);

    const authById = new Map(authUsers.map((u) => [u.id, u]));

    return profiles.map<AdminUserView>((p) => {
      const auth = authById.get(p.id);
      return {
        ...p,
        last_sign_in_at: auth?.last_sign_in_at ?? null,
        email_confirmed_at: auth?.email_confirmed_at ?? null,
        auth_created_at: auth?.created_at ?? p.created_at,
      };
    });
  },

  /**
   * Create a new user that can sign in immediately. The flow:
   *   1. Validate input
   *   2. `auth.admin.createUser({ email_confirm: true, password })`
   *      -- bypasses email verification
   *   3. The `handle_new_user` DB trigger inserts a default
   *      `gewci_users` row
   *   4. We immediately overwrite the trigger's role/display-name
   *      defaults with what the admin actually picked
   *   5. Audit log
   */
  async invite(
    ctx: RequestContext,
    rawInput: InviteUserInput,
    options: ServiceCallOptions = {},
  ): Promise<GEWCIUser> {
    await permissionsService.requireAdmin(ctx);
    const input = InviteUserSchema.parse(rawInput);

    let createdAuthUserId: string | null = null;
    try {
      const authUser = await adminUsersRepo.createUser({
        email: input.email,
        password: input.password,
        display_name: input.display_name,
      });
      createdAuthUserId = authUser.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/already.*registered|already exists|duplicate/i.test(message)) {
        throw new ConflictError(
          "A user with that email already exists",
          { email: input.email },
        );
      }
      throw err;
    }

    // The trigger should have created the gewci_users row by now. Update
    // it to the admin-chosen roles + display name. These writes go
    // through the service-role client because the regular session
    // client is bound by the `users_update_own` RLS policy and would
    // silently filter cross-user updates to zero rows.
    let profile: GEWCIUser;
    try {
      profile = await adminUsersRepo.setProfileRoles(
        createdAuthUserId,
        input.roles,
      );
      if (profile.display_name !== input.display_name) {
        profile = await adminUsersRepo.setProfileDisplayName(
          createdAuthUserId,
          input.display_name,
        );
      }
    } catch (err) {
      // The auth user exists but we couldn't finalize the profile -- rather
      // than leaving the system in a half-created state, roll back the
      // auth user so the admin can retry cleanly.
      console.error("invite: rolling back auth user after profile failure", err);
      try {
        await adminUsersRepo.deleteUser(createdAuthUserId);
      } catch (rollbackErr) {
        console.error("invite: rollback failed", rollbackErr);
      }
      throw err;
    }

    await auditService.record(
      ctx,
      {
        action: "user_invited",
        resource_type: "user",
        resource_id: createdAuthUserId,
        details: {
          email: input.email,
          display_name: input.display_name,
          roles: input.roles,
        },
      },
      { request: options.request },
    );

    return profile;
  },

  async update(
    ctx: RequestContext,
    targetUserId: string,
    rawInput: UpdateUserInput,
    options: ServiceCallOptions = {},
  ): Promise<GEWCIUser> {
    await permissionsService.requireAdmin(ctx);
    const input = UpdateUserSchema.parse(rawInput);

    const existing = await usersRepo.findById(ctx.supabase, targetUserId);
    if (!existing) {
      throw new NotFoundError("user", targetUserId);
    }

    if (input.roles) {
      // Self-demotion check: the actor cannot strip their own admin role.
      if (
        targetUserId === ctx.user.id &&
        existing.roles.includes(ROLE_ADMIN) &&
        !input.roles.includes(ROLE_ADMIN)
      ) {
        throw new ForbiddenError(
          "You cannot remove your own admin role. Ask another admin to do it.",
        );
      }

      // Last-admin check: don't let the org end up with zero admins.
      if (
        existing.roles.includes(ROLE_ADMIN) &&
        !input.roles.includes(ROLE_ADMIN)
      ) {
        const adminCount = await usersRepo.countAdmins(ctx.supabase);
        if (adminCount <= 1) {
          throw new ForbiddenError(
            "Cannot remove admin role from the last remaining admin.",
          );
        }
      }
    }

    // Same RLS reasoning as in `invite` -- cross-user writes go through
    // the service-role client.
    let updated: GEWCIUser = existing;
    if (input.roles) {
      updated = await adminUsersRepo.setProfileRoles(
        targetUserId,
        input.roles,
      );
    }
    if (input.display_name && input.display_name !== existing.display_name) {
      updated = await adminUsersRepo.setProfileDisplayName(
        targetUserId,
        input.display_name,
      );
    }

    await auditService.record(
      ctx,
      {
        action: "user_updated",
        resource_type: "user",
        resource_id: targetUserId,
        details: {
          before: {
            display_name: existing.display_name,
            roles: existing.roles,
          },
          after: {
            display_name: updated.display_name,
            roles: updated.roles,
          },
        },
      },
      { request: options.request },
    );

    return updated;
  },

  async delete(
    ctx: RequestContext,
    targetUserId: string,
    options: ServiceCallOptions = {},
  ): Promise<void> {
    await permissionsService.requireAdmin(ctx);

    if (targetUserId === ctx.user.id) {
      throw new ForbiddenError(
        "You cannot delete your own account from the admin UI.",
      );
    }

    const existing = await usersRepo.findById(ctx.supabase, targetUserId);
    if (!existing) {
      throw new NotFoundError("user", targetUserId);
    }

    if (existing.roles.includes(ROLE_ADMIN)) {
      const adminCount = await usersRepo.countAdmins(ctx.supabase);
      if (adminCount <= 1) {
        throw new ForbiddenError(
          "Cannot delete the last remaining admin.",
        );
      }
    }

    // Deleting from auth.users cascades to gewci_users via the FK
    // ON DELETE CASCADE clause in the initial schema.
    await adminUsersRepo.deleteUser(targetUserId);

    await auditService.record(
      ctx,
      {
        action: "user_deleted",
        resource_type: "user",
        resource_id: targetUserId,
        details: {
          email: existing.email,
          roles: existing.roles,
        },
      },
      { request: options.request },
    );
  },
};
