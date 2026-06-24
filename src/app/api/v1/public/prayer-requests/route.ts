import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/http";
import { prayerRequestsService } from "@/lib/services/prayer-requests.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prayerRequest = await prayerRequestsService.submitPublic(body, request);
    return NextResponse.json({ prayerRequest }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
