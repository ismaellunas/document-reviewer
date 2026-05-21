/**
 * Role string constants for the document-review tool. Keeping them here
 * means consumers never hard-code "document-review:admin" again, and the
 * full set is grep-able from a single file.
 */

export const ROLE_ADMIN = "document-review:admin";
export const ROLE_EDITOR = "document-review:editor";
export const ROLE_REVIEWER = "document-review:reviewer";
export const ROLE_VIEWER = "document-review:viewer";

export type Role =
  | typeof ROLE_ADMIN
  | typeof ROLE_EDITOR
  | typeof ROLE_REVIEWER
  | typeof ROLE_VIEWER;

export function hasRole(roles: readonly string[] | null | undefined, role: Role): boolean {
  if (!roles) return false;
  return roles.includes(role);
}

export function hasAnyRole(
  roles: readonly string[] | null | undefined,
  ...required: Role[]
): boolean {
  if (!roles) return false;
  return required.some((r) => roles.includes(r));
}
