import { NextResponse } from "next/server";

import { withAuth } from "@/lib/http";
import { usersService } from "@/lib/services/users.service";

export const GET = withAuth(async ({ ctx }) => {
  const users = await usersService.list(ctx);
  return NextResponse.json({ users });
});

export const POST = withAuth(async ({ ctx, request }) => {
  const body = await request.json();
  const user = await usersService.invite(ctx, body, { request });
  return NextResponse.json({ user }, { status: 201 });
});
