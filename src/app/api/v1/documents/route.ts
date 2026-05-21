import { NextResponse } from "next/server";

import { withAuth } from "@/lib/http";
import { ListDocumentsQuerySchema } from "@/lib/schemas/documents";
import { documentsService } from "@/lib/services/documents.service";

export const GET = withAuth(async ({ ctx, request }) => {
  const { searchParams } = new URL(request.url);
  const query = ListDocumentsQuerySchema.parse({
    status: searchParams.get("status") ?? undefined,
  });

  const documents = await documentsService.list(ctx, query);
  return NextResponse.json({ documents });
});

export const POST = withAuth(async ({ ctx, request }) => {
  const body = await request.json();
  const document = await documentsService.create(ctx, body, { request });
  return NextResponse.json({ document }, { status: 201 });
});
