/**
 * Pure permission predicates. Used by both the service layer (to throw
 * ForbiddenError) and by UI server components (to decide whether to render
 * controls). Returning booleans keeps these unit-testable and free of any
 * HTTP / DB coupling.
 *
 * The single source of truth for who can do what.
 */

import { hasAnyRole, hasRole, ROLE_ADMIN, ROLE_EDITOR, ROLE_REVIEWER } from "./roles";

interface OwnableDocument {
  created_by: string;
}

export function canCreateDocument(roles: readonly string[]): boolean {
  return hasAnyRole(roles, ROLE_ADMIN, ROLE_EDITOR);
}

export function canEditDocument(
  roles: readonly string[],
  doc: OwnableDocument,
  userId: string,
): boolean {
  if (hasAnyRole(roles, ROLE_ADMIN, ROLE_EDITOR)) return true;
  return doc.created_by === userId;
}

export function canDeleteDocument(
  roles: readonly string[],
  doc: OwnableDocument,
  userId: string,
): boolean {
  if (hasRole(roles, ROLE_ADMIN)) return true;
  return doc.created_by === userId;
}

export function canCommentOnDocument(roles: readonly string[]): boolean {
  return hasAnyRole(roles, ROLE_ADMIN, ROLE_EDITOR, ROLE_REVIEWER);
}

export function canResolveComment(roles: readonly string[]): boolean {
  return hasAnyRole(roles, ROLE_ADMIN, ROLE_EDITOR, ROLE_REVIEWER);
}

export function canDeleteComment(
  roles: readonly string[],
  comment: { user_id: string },
  userId: string,
): boolean {
  if (hasRole(roles, ROLE_ADMIN)) return true;
  return comment.user_id === userId;
}
