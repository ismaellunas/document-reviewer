import { NextResponse } from "next/server";

import { withAuth } from "@/lib/http";
import { ListPrayerRequestsQuerySchema } from "@/lib/schemas/prayer-requests";
import { prayerRequestsService } from "@/lib/services/prayer-requests.service";

export const GET = withAuth(async ({ ctx, request }) => {
  const { searchParams } = new URL(request.url);
  const query = ListPrayerRequestsQuerySchema.parse({
    status: searchParams.get("status") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });

  const prayerRequests = await prayerRequestsService.listForAdmin(ctx, query);
  return NextResponse.json({ prayerRequests });
});

export const POST = withAuth(async ({ ctx, request }) => {
  const body = await request.json();
  const result = await prayerRequestsService.bulkAction(ctx, body);
  return NextResponse.json(result);
});
