import { supabase } from "@/integrations/supabase/client";

export async function logAudit(
  action: string,
  resourceType?: string,
  resourceId?: string,
  details: Record<string, unknown> = {},
) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });
    if (!isAdmin) return;
    await supabase.from("audit_logs").insert({
      actor_id: data.user.id,
      actor_email: data.user.email,
      action,
      resource_type: resourceType ?? null,
      resource_id: resourceId ?? null,
      details,
    });
  } catch (err) {
    console.error("[audit] failed", err);
  }
}
