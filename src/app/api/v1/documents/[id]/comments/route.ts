import { NextResponse } from "next/server";

import { withAuth } from "@/lib/http";
import { commentsService } from "@/lib/services/comments.service";

export const GET = withAuth<{ id: string }>(async ({ ctx, params }) => {
  const { id } = await params;
  const comments = await commentsService.listForDocument(ctx, id);
  return NextResponse.json({ comments });
});

export const POST = withAuth<{ id: string }>(async ({ ctx, request, params }) => {
  const { id: documentId } = await params;
  const body = await request.json();
  const comment = await commentsService.create(ctx, documentId, body, {
    request,
  });
  return NextResponse.json({ comment }, { status: 201 });
});
