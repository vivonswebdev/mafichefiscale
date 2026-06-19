import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

async function logAction(
  supabaseAdmin: any,
  actorId: string,
  actorEmail: string | null,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details: Record<string, unknown> = {},
) {
  await supabaseAdmin.from("audit_logs").insert({
    actor_id: actorId,
    actor_email: actorEmail,
    action,
    resource_type: resourceType ?? null,
    resource_id: resourceId ?? null,
    details: details as never,
  });
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: usersList, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (error) throw new Error(error.message);

    const [rolesRes, fichesRes, clientsRes, profilesRes] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("fiches").select("user_id"),
      supabaseAdmin.from("clients").select("user_id"),
      supabaseAdmin.from("profiles").select("id, full_name, cabinet"),
    ]);

    const rolesByUser = new Map<string, string[]>();
    (rolesRes.data ?? []).forEach((r: any) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    const fichesCount = new Map<string, number>();
    (fichesRes.data ?? []).forEach((f: any) =>
      fichesCount.set(f.user_id, (fichesCount.get(f.user_id) ?? 0) + 1),
    );
    const clientsCount = new Map<string, number>();
    (clientsRes.data ?? []).forEach((c: any) =>
      clientsCount.set(c.user_id, (clientsCount.get(c.user_id) ?? 0) + 1),
    );
    const profileById = new Map<string, any>();
    (profilesRes.data ?? []).forEach((p: any) => profileById.set(p.id, p));

    return usersList.users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      roles: rolesByUser.get(u.id) ?? [],
      fiches_count: fichesCount.get(u.id) ?? 0,
      clients_count: clientsCount.get(u.id) ?? 0,
      full_name: profileById.get(u.id)?.full_name ?? null,
      cabinet: profileById.get(u.id)?.cabinet ?? null,
    }));
  });

export const grantAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: "admin" });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    await logAction(
      supabaseAdmin,
      context.userId,
      (context.claims as any)?.email ?? null,
      "admin.role.grant",
      "user",
      data.userId,
      { role: "admin" },
    );
    return { ok: true };
  });

export const revokeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) {
      throw new Error("Vous ne pouvez pas retirer votre propre rôle admin.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    await logAction(
      supabaseAdmin,
      context.userId,
      (context.claims as any)?.email ?? null,
      "admin.role.revoke",
      "user",
      data.userId,
      { role: "admin" },
    );
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) {
      throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await logAction(
      supabaseAdmin,
      context.userId,
      (context.claims as any)?.email ?? null,
      "admin.user.delete",
      "user",
      data.userId,
    );
    return { ok: true };
  });

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [fichesRes, clientsRes, dirigeantsRes, usersRes, recentFiches] = await Promise.all([
      supabaseAdmin.from("fiches").select("id, status, montant_brut, year"),
      supabaseAdmin.from("clients").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("dirigeants").select("id", { count: "exact", head: true }),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 }),
      supabaseAdmin
        .from("fiches")
        .select("id, year, status, montant_brut, created_at, user_id, clients(name)")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const fiches = fichesRes.data ?? [];
    const totalMontant = fiches.reduce(
      (s: number, f: any) => s + Number(f.montant_brut ?? 0),
      0,
    );
    const byStatus: Record<string, number> = {};
    fiches.forEach((f: any) => {
      byStatus[f.status] = (byStatus[f.status] ?? 0) + 1;
    });

    return {
      fichesCount: fiches.length,
      clientsCount: clientsRes.count ?? 0,
      dirigeantsCount: dirigeantsRes.count ?? 0,
      usersCount: (usersRes.data as any)?.total ?? usersRes.data?.users?.length ?? 0,
      totalMontant,
      byStatus,
      recentFiches: recentFiches.data ?? [],
    };
  });
