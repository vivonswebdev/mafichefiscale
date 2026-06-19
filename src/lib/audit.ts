import { supabase } from "@/integrations/supabase/client";

/**
 * Log an admin action. The Postgres function `log_admin_action` enforces
 * that only authenticated admins can write — non-admin callers get a
 * "Forbidden" error which we silently swallow.
 */
export async function logAudit(
  action: string,
  resourceType?: string,
  resourceId?: string,
  details: Record<string, unknown> = {},
) {
  try {
    await supabase.rpc("log_admin_action", {
      _action: action,
      _resource_type: resourceType,
      _resource_id: resourceId,
      _details: details as never,
    });
  } catch (err) {
    console.warn("[audit] skipped", err);
  }
}
