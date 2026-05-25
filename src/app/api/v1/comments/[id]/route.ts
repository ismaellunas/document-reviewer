import { NextResponse } from "next/server";

import { withAuth } from "@/lib/http";
import { commentsService } from "@/lib/services/comments.service";

/**
 * PATCH /api/v1/comments/[id]
 *
 * Currently used for the resolve / unresolve toggle. Accepts:
 *   { is_resolved: boolean }
 *
 * Replaces the previous flow where the client wrote directly to Supabase
 * and then POSTed to /api/v1/documents/audit -- both responsibilities now
 * live in the comments service.
 */
export const PATCH = withAuth<{ id: string }>(async ({ ctx, request, params }) => {
  const { id } = await params;
  const body = await request.json();
  const comment = await commentsService.setResolution(ctx, id, body, {
    request,
  });
  return NextResponse.json({ comment });
});

export const DELETE = withAuth<{ id: string }>(async ({ ctx, request, params }) => {
  const { id } = await params;
  await commentsService.delete(ctx, id, { request });
  return NextResponse.json({ success: true });
});
