import { SupabaseClient } from "@supabase/supabase-js";
import { AuditLogEntry } from "./types";

/**
 * Log an action to the central GEWCI audit logs.
 */
export async function logAudit(
  supabase: SupabaseClient,
  entry: Omit<AuditLogEntry, "ip_address" | "user_agent" | "id" | "created_at">,
  request?: Request
) {
  let ipAddress = null;
  let userAgent = null;

  if (request) {
    // Attempt to extract client ip and user agent from request headers
    const forwardedFor = request.headers.get("x-forwarded-for");
    ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : null;
    userAgent = request.headers.get("user-agent");
  }

  try {
    const { error } = await supabase.from("gewci_audit_logs").insert({
      tool_type: entry.tool_type,
      user_id: entry.user_id,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      details: entry.details || {},
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (error) {
      console.error("Supabase audit logging error:", error);
    }
  } catch (err) {
    console.error("Failed to insert audit log:", err);
  }
}
