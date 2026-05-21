/**
 * Comments service. Owns the comment lifecycle: list, create, resolve.
 */

import {
  ForbiddenError,
  NotFoundError,
  RlsBlockedError,
} from "@/lib/errors";
import type { RequestContext } from "@/lib/http";
import {
  canCommentOnDocument,
  canResolveComment,
} from "@/lib/auth/policies";
import {
  CreateCommentSchema,
  UpdateCommentResolutionSchema,
  type CreateCommentInput,
  type UpdateCommentResolutionInput,
} from "@/lib/schemas/comments";
import { commentsRepo } from "@/lib/repositories/comments.repo";
import { documentsRepo } from "@/lib/repositories/documents.repo";
import { usersRepo } from "@/lib/repositories/users.repo";
import { auditService } from "@/lib/services/audit.service";
import type { DRRComment } from "@/lib/types";

interface ServiceCallOptions {
  request?: Request;
}

export const commentsService = {
  async listForDocument(
    ctx: RequestContext,
    documentId: string,
  ): Promise<DRRComment[]> {
    return commentsRepo.listForDocument(ctx.supabase, documentId);
  },

  async create(
    ctx: RequestContext,
    documentId: string,
    rawInput: CreateCommentInput,
    options: ServiceCallOptions = {},
  ): Promise<DRRComment> {
    const input = CreateCommentSchema.parse(rawInput);

    const document = await documentsRepo.findById(ctx.supabase, documentId);
    if (!document) {
      throw new NotFoundError("document", documentId);
    }

    const roles = await usersRepo.getRoles(ctx.supabase, ctx.user.id);
    if (!canCommentOnDocument(roles)) {
      throw new ForbiddenError(
        "Access Denied: You do not have permission to comment on documents",
      );
    }

    const comment = await commentsRepo.create(ctx.supabase, {
      document_id: documentId,
      user_id: ctx.user.id,
      content: input.content,
      parent_id: input.parent_id ?? null,
      anchor_text: input.anchor_text ?? null,
      anchor_start: input.anchor_start ?? null,
      anchor_end: input.anchor_end ?? null,
    });

    await auditService.record(
      ctx,
      {
        action: "annotation_added",
        resource_type: "annotation",
        resource_id: comment.id,
        details: {
          document_id: documentId,
          is_reply: !!input.parent_id,
          parent_comment_id: input.parent_id ?? null,
          has_anchor: !!input.anchor_text,
        },
      },
      { request: options.request },
    );

    return comment;
  },

  async setResolution(
    ctx: RequestContext,
    commentId: string,
    rawInput: UpdateCommentResolutionInput,
    options: ServiceCallOptions = {},
  ): Promise<DRRComment> {
    const input = UpdateCommentResolutionSchema.parse(rawInput);

    const existing = await commentsRepo.findById(ctx.supabase, commentId);
    if (!existing) {
      throw new NotFoundError("comment", commentId);
    }

    const roles = await usersRepo.getRoles(ctx.supabase, ctx.user.id);
    if (!canResolveComment(roles)) {
      throw new ForbiddenError(
        "Access Denied: You do not have permission to resolve comments",
      );
    }

    const { affected, comment } = await commentsRepo.updateResolution(
      ctx.supabase,
      commentId,
      {
        is_resolved: input.is_resolved,
        resolved_by: input.is_resolved ? ctx.user.id : null,
        resolved_at: input.is_resolved ? new Date().toISOString() : null,
      },
    );

    if (affected === 0 || !comment) {
      console.error("Resolution update returned zero rows -- check RLS for drr_comments", { commentId });
      throw new RlsBlockedError(
        "Resolution update was blocked by a database policy.",
      );
    }

    await auditService.record(
      ctx,
      {
        action: input.is_resolved
          ? "annotation_resolved"
          : "annotation_unresolved",
        resource_type: "annotation",
        resource_id: commentId,
        details: { document_id: existing.document_id },
      },
      { request: options.request },
    );

    return comment;
  },
};
