import { NextResponse } from "next/server";

import { withAuth } from "@/lib/http";
import { usersService } from "@/lib/services/users.service";

export const PATCH = withAuth<{ id: string }>(async ({ ctx, request, params }) => {
  const { id } = await params;
  const body = await request.json();
  const user = await usersService.update(ctx, id, body, { request });
  return NextResponse.json({ user });
});

export const DELETE = withAuth<{ id: string }>(async ({ ctx, request, params }) => {
  const { id } = await params;
  await usersService.delete(ctx, id, { request });
  return NextResponse.json({ success: true });
});
