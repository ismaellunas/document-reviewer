import { NextResponse } from "next/server";

import { withAuth } from "@/lib/http";
import { documentsService } from "@/lib/services/documents.service";

export const GET = withAuth<{ id: string }>(async ({ ctx, params }) => {
  const { id } = await params;
  const { document } = await documentsService.getDetail(ctx, id);
  return NextResponse.json({ document });
});

export const PUT = withAuth<{ id: string }>(async ({ ctx, request, params }) => {
  const { id } = await params;
  const body = await request.json();
  const document = await documentsService.update(ctx, id, body, { request });
  return NextResponse.json({ document });
});

export const DELETE = withAuth<{ id: string }>(async ({ ctx, request, params }) => {
  const { id } = await params;
  await documentsService.delete(ctx, id, { request });
  return NextResponse.json({ success: true });
});
