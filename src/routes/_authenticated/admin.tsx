import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Shield, ScrollText, Users, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/auth" });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Administration — mafiche.be" },
      { name: "description", content: "Journal d'audit et supervision des actions admin." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [logsRes, fichesRes, clientsRes] = await Promise.all([
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("fiches").select("id", { count: "exact", head: true }),
        supabase.from("clients").select("id", { count: "exact", head: true }),
      ]);
      return {
        logs: logsRes.data ?? [],
        fichesCount: fichesRes.count ?? 0,
        clientsCount: clientsRes.count ?? 0,
      };
    },
  });

  const logs = data?.logs ?? [];

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-3">
          <span
            className="grid place-items-center w-11 h-11 rounded-md text-primary"
            style={{ backgroundColor: "rgba(201,164,92,0.10)", border: "1px solid rgba(201,164,92,0.28)" }}
          >
            <Shield className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xs text-ink-3 font-mono uppercase tracking-wider">Espace administrateur</p>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">Supervision &amp; audit</h1>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { label: "Entrées d'audit", value: String(logs.length), icon: ScrollText },
            { label: "Fiches totales", value: String(data?.fichesCount ?? 0), icon: FileText },
            { label: "Clients totaux", value: String(data?.clientsCount ?? 0), icon: Users },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="rounded-lg border border-gold-border bg-surface p-[22px] shadow-notary">
                <div
                  className="w-10 h-10 rounded-md grid place-items-center text-primary"
                  style={{ backgroundColor: "rgba(201,164,92,0.10)", border: "1px solid rgba(201,164,92,0.22)" }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="mt-5 font-serif text-3xl font-semibold tracking-tight">{m.value}</div>
                <div className="mt-1 text-sm text-ink-2">{m.label}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-lg border border-gold-border bg-surface overflow-hidden shadow-notary">
          <div className="px-6 py-5 border-b border-gold-border">
            <h2 className="text-[13px] font-bold tracking-tight text-ink uppercase">Journal d'audit</h2>
            <p className="text-sm text-ink-3 mt-1">Les 100 dernières actions enregistrées</p>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-ink-3">Chargement…</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <ScrollText className="w-10 h-10 text-ink-3 mx-auto mb-3" />
              <p className="text-ink-2">Aucune action enregistrée pour l'instant.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: "#182032" }}>
                  <tr className="text-left text-[10px] font-mono uppercase tracking-[0.12em] text-ink-3 border-b border-gold-border">
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Acteur</th>
                    <th className="px-6 py-3 font-medium">Action</th>
                    <th className="px-6 py-3 font-medium">Ressource</th>
                    <th className="px-6 py-3 font-medium">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l: any) => (
                    <tr key={l.id} className="border-b border-gold-border last:border-none hover:bg-surface-2 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-ink-2">
                        {new Date(l.created_at).toLocaleString("fr-BE")}
                      </td>
                      <td className="px-6 py-4 text-ink">{l.actor_email ?? "—"}</td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center text-[11px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm border text-primary"
                          style={{ backgroundColor: "rgba(201,164,92,0.10)", borderColor: "rgba(201,164,92,0.28)" }}
                        >
                          {l.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-ink-2 font-mono text-xs">
                        {l.resource_type ? `${l.resource_type}${l.resource_id ? ` · ${l.resource_id.slice(0, 8)}` : ""}` : "—"}
                      </td>
                      <td className="px-6 py-4 text-ink-3 font-mono text-[11px] max-w-md truncate">
                        {l.details && Object.keys(l.details).length > 0 ? JSON.stringify(l.details) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
