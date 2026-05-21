import { z } from "zod";

import {
  ROLE_ADMIN,
  ROLE_EDITOR,
  ROLE_REVIEWER,
  ROLE_VIEWER,
} from "@/lib/auth/roles";

const RoleEnum = z.enum([
  ROLE_ADMIN,
  ROLE_EDITOR,
  ROLE_REVIEWER,
  ROLE_VIEWER,
]);

const RolesArray = z
  .array(RoleEnum)
  .min(1, "Select at least one role")
  .max(4, "Too many roles")
  .refine((arr) => new Set(arr).size === arr.length, {
    message: "Duplicate roles are not allowed",
  });

const Email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email")
  .toLowerCase();

const DisplayName = z
  .string()
  .trim()
  .min(1, "Display name is required")
  .max(255, "Display name must be 255 characters or fewer");

const Password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be 128 characters or fewer");

export const InviteUserSchema = z.object({
  email: Email,
  display_name: DisplayName,
  password: Password,
  roles: RolesArray,
});

export const UpdateUserSchema = z
  .object({
    display_name: DisplayName.optional(),
    roles: RolesArray.optional(),
  })
  .refine((v) => v.display_name !== undefined || v.roles !== undefined, {
    message: "No fields to update",
  });

export type InviteUserInput = z.infer<typeof InviteUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
