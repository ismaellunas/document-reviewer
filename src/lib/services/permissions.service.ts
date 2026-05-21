/**
 * Permissions service. Lets server components ask "what can the current
 * viewer do with this document?" without re-implementing role lookups
 * everywhere. Returns booleans only -- the service layer translates
 * permission failures into ForbiddenError when the action is attempted.
 */

import { ForbiddenError } from "@/lib/errors";
import type { RequestContext } from "@/lib/http";
import {
  canDeleteDocument,
  canEditDocument,
  canCommentOnDocument,
  canCreateDocument,
  isAdmin,
} from "@/lib/auth/policies";
import { usersRepo } from "@/lib/repositories/users.repo";
import type { DocumentViewerCapabilities, DRRDocument } from "@/lib/types";

export const permissionsService = {
  /**
   * Compute the viewer's per-document capabilities. Single role lookup,
   * single source of truth for the UI's "can edit" / "can delete" gating.
   */
  async getDocumentCapabilities(
    ctx: RequestContext,
    doc: Pick<DRRDocument, "created_by">,
  ): Promise<DocumentViewerCapabilities> {
    const roles = await usersRepo.getRoles(ctx.supabase, ctx.user.id);
    return {
      canEdit: canEditDocument(roles, doc, ctx.user.id),
      canDelete: canDeleteDocument(roles, doc, ctx.user.id),
      canComment: canCommentOnDocument(roles),
    };
  },

  /**
   * Whether the current viewer can create new documents. Used to render
   * (or hide) the "New Document" button on dashboard / list pages.
   */
  async canCreateDocuments(ctx: RequestContext): Promise<boolean> {
    const roles = await usersRepo.getRoles(ctx.supabase, ctx.user.id);
    return canCreateDocument(roles);
  },

  /**
   * Predicate variant -- returns false instead of throwing. Used by UI
   * to decide whether to render the "User management" link.
   */
  async isAdmin(ctx: RequestContext): Promise<boolean> {
    const roles = await usersRepo.getRoles(ctx.supabase, ctx.user.id);
    return isAdmin(roles);
  },

  /**
   * Guard for admin-only services and pages. Throws ForbiddenError when
   * the caller is not an admin so the route handler emits 403 and the
   * server component can `redirect()` to a safe page.
   */
  async requireAdmin(ctx: RequestContext): Promise<void> {
    const roles = await usersRepo.getRoles(ctx.supabase, ctx.user.id);
    if (!isAdmin(roles)) {
      throw new ForbiddenError("Admin access required");
    }
  },
};
