/**
 * Audit service. Wraps the audit repository with concerns that don't belong
 * in the data layer:
 *   - Extract IP / User-Agent from the optional Request
 *   - Stamp every entry with `tool_type: "document-review"`
 *   - Pull `user_id` from the request context so callers don't repeat it
 */

import type { RequestContext } from "@/lib/http";
import { auditRepo, type AuditLogInsert } from "@/lib/repositories/audit.repo";

const TOOL_TYPE = "document-review";

export interface AuditEntryDraft {
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details?: Record<string, unknown>;
}

interface RecordOptions {
  request?: Request;
}

function extractClientMeta(request?: Request): {
  ip: string | null;
  userAgent: string | null;
} {
  if (!request) return { ip: null, userAgent: null };

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : null;
  const userAgent = request.headers.get("user-agent");
  return { ip, userAgent };
}

export const auditService = {
  async record(
    ctx: RequestContext,
    draft: AuditEntryDraft,
    options: RecordOptions = {},
  ): Promise<void> {
    const { ip, userAgent } = extractClientMeta(options.request);

    const entry: AuditLogInsert = {
      tool_type: TOOL_TYPE,
      user_id: ctx.user.id,
      action: draft.action,
      resource_type: draft.resource_type,
      resource_id: draft.resource_id,
      details: draft.details ?? {},
      ip_address: ip,
      user_agent: userAgent,
    };

    await auditRepo.insert(ctx.supabase, entry);
  },
};
