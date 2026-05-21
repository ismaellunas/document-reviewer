import { NextResponse } from "next/server";

import { withAuth } from "@/lib/http";
import { permissionsService } from "@/lib/services/permissions.service";

/**
 * Returns the current viewer's capability flags so client components
 * (notably the global Header) can render role-gated UI without re-doing
 * role lookups themselves.
 */
export const GET = withAuth(async ({ ctx }) => {
  const [isAdmin, canCreateDocuments] = await Promise.all([
    permissionsService.isAdmin(ctx),
    permissionsService.canCreateDocuments(ctx),
  ]);

  return NextResponse.json({
    capabilities: {
      isAdmin,
      canCreateDocuments,
    },
  });
});
