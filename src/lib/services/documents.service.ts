/**
 * Documents service. Owns the business logic for the document lifecycle:
 *   - Permission checks (delegated to lib/auth/policies)
 *   - Validation (delegated to Zod schemas)
 *   - Audit fan-out
 *   - Composing the repository calls into use-case-shaped methods
 *
 * Routes and server components both call into this layer; nothing in
 * here knows about HTTP / Next.js / cookies.
 */

import {
  ForbiddenError,
  NotFoundError,
  RlsBlockedError,
} from "@/lib/errors";
import type { RequestContext } from "@/lib/http";
import {
  canCreateDocument,
  canDeleteDocument,
  canEditDocument,
} from "@/lib/auth/policies";
import {
  CreateDocumentSchema,
  UpdateDocumentSchema,
  type CreateDocumentInput,
  type UpdateDocumentInput,
} from "@/lib/schemas/documents";
import { documentsRepo } from "@/lib/repositories/documents.repo";
import { commentsRepo } from "@/lib/repositories/comments.repo";
import { usersRepo } from "@/lib/repositories/users.repo";
import { auditService } from "@/lib/services/audit.service";
import { permissionsService } from "@/lib/services/permissions.service";
import type {
  DashboardData,
  DocumentStatus,
  DocumentViewerCapabilities,
  DRRComment,
  DRRDocument,
} from "@/lib/types";

interface ServiceCallOptions {
  request?: Request;
}

export const documentsService = {
  async list(
    ctx: RequestContext,
    filters: { status?: DocumentStatus } = {},
  ): Promise<DRRDocument[]> {
    return documentsRepo.listWithCreator(ctx.supabase, {
      status: filters.status,
    });
  },

  /**
   * Fetch a single document for the read-only detail view, plus the
   * viewer's capabilities so the page can decide which controls to show.
   */
  async getDetail(
    ctx: RequestContext,
    id: string,
  ): Promise<{
    document: DRRDocument;
    comments: DRRComment[];
    viewerCapabilities: DocumentViewerCapabilities;
  }> {
    const document = await documentsRepo.findByIdWithCreator(ctx.supabase, id);
    if (!document) {
      throw new NotFoundError("document", id);
    }

    const [comments, viewerCapabilities] = await Promise.all([
      commentsRepo.listForDocument(ctx.supabase, id),
      permissionsService.getDocumentCapabilities(ctx, document),
    ]);

    return { document, comments, viewerCapabilities };
  },

  /**
   * Fetch a document for the edit form. Throws ForbiddenError when the
   * viewer lacks edit rights so the route handler / page can react.
   */
  async getDetailForEdit(
    ctx: RequestContext,
    id: string,
  ): Promise<DRRDocument> {
    const document = await documentsRepo.findById(ctx.supabase, id);
    if (!document) {
      throw new NotFoundError("document", id);
    }

    const roles = await usersRepo.getRoles(ctx.supabase, ctx.user.id);
    if (!canEditDocument(roles, document, ctx.user.id)) {
      throw new ForbiddenError(
        "You do not have permission to edit this document",
      );
    }
    return document;
  },

  async create(
    ctx: RequestContext,
    rawInput: CreateDocumentInput,
    options: ServiceCallOptions = {},
  ): Promise<DRRDocument> {
    const input = CreateDocumentSchema.parse(rawInput);

    const roles = await usersRepo.getRoles(ctx.supabase, ctx.user.id);
    if (!canCreateDocument(roles)) {
      throw new ForbiddenError(
        "Access Denied: Only Admins and Editors can create documents",
      );
    }

    const document = await documentsRepo.create(ctx.supabase, {
      title: input.title,
      content: input.content,
      status: input.status,
      created_by: ctx.user.id,
    });

    await auditService.record(
      ctx,
      {
        action: "document_created",
        resource_type: "document",
        resource_id: document.id,
        details: { title: input.title, status: input.status },
      },
      { request: options.request },
    );

    return document;
  },

  async update(
    ctx: RequestContext,
    id: string,
    rawInput: UpdateDocumentInput,
    options: ServiceCallOptions = {},
  ): Promise<DRRDocument> {
    const input = UpdateDocumentSchema.parse(rawInput);

    const existing = await documentsRepo.findById(ctx.supabase, id);
    if (!existing) {
      throw new NotFoundError("document", id);
    }

    const roles = await usersRepo.getRoles(ctx.supabase, ctx.user.id);
    if (!canEditDocument(roles, existing, ctx.user.id)) {
      throw new ForbiddenError(
        "Access Denied: You do not have permission to edit this document",
      );
    }

    const updated = await documentsRepo.update(ctx.supabase, id, {
      title: input.title,
      content: input.content,
      status: input.status,
      updated_by: ctx.user.id,
    });

    await auditService.record(
      ctx,
      {
        action: "document_updated",
        resource_type: "document",
        resource_id: id,
        details: {
          status_changed: existing.status !== updated.status,
          old_status: existing.status,
          new_status: updated.status,
        },
      },
      { request: options.request },
    );

    return updated;
  },

  async delete(
    ctx: RequestContext,
    id: string,
    options: ServiceCallOptions = {},
  ): Promise<void> {
    const existing = await documentsRepo.findById(ctx.supabase, id);
    if (!existing) {
      throw new NotFoundError("document", id);
    }

    const roles = await usersRepo.getRoles(ctx.supabase, ctx.user.id);
    if (!canDeleteDocument(roles, existing, ctx.user.id)) {
      throw new ForbiddenError(
        "Access Denied: Only the creator or an Admin can delete this document",
      );
    }

    const { affected } = await documentsRepo.deleteAndConfirm(ctx.supabase, id);
    if (affected === 0) {
      // RLS silently filtered the delete -- surface as a hard error.
      console.error("DELETE returned zero rows -- check RLS for drr_documents", { id });
      throw new RlsBlockedError(
        "Delete was blocked by a database policy. Ask an admin to verify RLS on drr_documents.",
      );
    }

    await auditService.record(
      ctx,
      {
        action: "document_deleted",
        resource_type: "document",
        resource_id: id,
        details: { title: existing.title },
      },
      { request: options.request },
    );
  },

  /**
   * One-shot data loader for the dashboard page: stats + recent docs +
   * the "can the viewer create new documents?" flag.
   */
  async getDashboardData(ctx: RequestContext): Promise<DashboardData> {
    const [
      totalDocs,
      inReviewDocs,
      approvedDocs,
      totalComments,
      recentDocs,
      canCreate,
    ] = await Promise.all([
      documentsRepo.countByStatus(ctx.supabase),
      documentsRepo.countByStatus(ctx.supabase, "in_review"),
      documentsRepo.countByStatus(ctx.supabase, "approved"),
      commentsRepo.countAll(ctx.supabase),
      documentsRepo.listWithCreator(ctx.supabase, { limit: 6 }),
      permissionsService.canCreateDocuments(ctx),
    ]);

    return {
      stats: { totalDocs, inReviewDocs, approvedDocs, totalComments },
      recentDocs,
      canCreate,
    };
  },
};
