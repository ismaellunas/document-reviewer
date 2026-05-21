/**
 * Repository for the `gewci_audit_logs` table. The previous helper at
 * `src/lib/audit.ts` mixed request-header parsing into the data layer;
 * that responsibility moved to `audit.service.ts`. The repo is now a
 * thin insert.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AuditLogEntry } from "@/lib/types";

export type AuditLogInsert = Omit<AuditLogEntry, "id" | "created_at">;

export const auditRepo = {
  async insert(
    supabase: SupabaseClient,
    entry: AuditLogInsert,
  ): Promise<void> {
    const { error } = await supabase.from("gewci_audit_logs").insert({
      tool_type: entry.tool_type,
      user_id: entry.user_id,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      details: entry.details ?? {},
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
    });

    if (error) {
      // Audit failures are observable but never block the primary action.
      console.error("auditRepo.insert error:", { entry, error });
    }
  },
};
