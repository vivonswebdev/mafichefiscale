import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import {
  listUsers,
  grantAdmin,
  revokeAdmin,
  deleteUser,
  adminOverview,
} from "@/lib/admin.functions";
import {
  Shield, ScrollText, Users, FileText, Building2,
  TrendingUp, ShieldCheck, ShieldOff, Trash2, Search,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/auth", search: { next: "/app" } });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/app" });
  },
  head: () => ({
    meta: [
      { title: "Administration — mafiche.be" },
      { name: "description", content: "Tableau de bord administrateur : supervision, gestion des utilisateurs et journal d'audit." },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "users" | "audit";

function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <header className="flex items-center gap-3">
          <span
            className="grid place-items-center w-11 h-11 rounded-md text-primary"
            style={{ backgroundColor: "rgba(201,164,92,0.10)", border: "1px solid rgba(201,164,92,0.28)" }}
          >
            <Shield className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xs text-ink-3 font-mono uppercase tracking-wider">Espace administrateur</p>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">Tableau de bord admin</h1>
          </div>
        </header>

        <nav className="mt-8 flex gap-1 border-b border-gold-border" role="tablist">
          {[
            { id: "overview" as const, label: "Vue d'ensemble", icon: TrendingUp },
            { id: "users" as const, label: "Utilisateurs", icon: Users },
            { id: "audit" as const, label: "Journal d'audit", icon: ScrollText },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-ink-2 hover:text-ink"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-8">
          {tab === "overview" && <OverviewTab />}
          {tab === "users" && <UsersTab />}
          {tab === "audit" && <AuditTab />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

/* -------------------- Overview -------------------- */
function OverviewTab() {
  const fn = useServerFn(adminOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fn(),
  });

  if (isLoading) return <div className="text-ink-3 p-10 text-center">Chargement…</div>;
  if (!data) return null;

  const metrics = [
    { label: "Utilisateurs", value: data.usersCount, icon: Users },
    { label: "Clients", value: data.clientsCount, icon: Building2 },
    { label: "Dirigeants", value: data.dirigeantsCount, icon: Users },
    { label: "Fiches 281.20", value: data.fichesCount, icon: FileText },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m) => {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-lg border border-gold-border bg-surface p-6 shadow-notary">
          <h2 className="text-[13px] font-bold tracking-tight text-ink uppercase mb-4">Montant brut total</h2>
          <div className="font-serif text-4xl font-semibold tracking-tight text-primary">
            {new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(data.totalMontant)}
          </div>
          <p className="text-sm text-ink-3 mt-2">Cumul sur toutes les fiches enregistrées</p>
        </div>

        <div className="rounded-lg border border-gold-border bg-surface p-6 shadow-notary">
          <h2 className="text-[13px] font-bold tracking-tight text-ink uppercase mb-4">Fiches par statut</h2>
          <div className="space-y-2">
            {Object.entries(data.byStatus).length === 0 ? (
              <p className="text-sm text-ink-3">Aucune fiche</p>
            ) : (
              Object.entries(data.byStatus).map(([s, n]) => (
                <div key={s} className="flex items-center justify-between text-sm">
                  <span className="font-mono uppercase text-xs tracking-wider text-ink-2">{s}</span>
                  <span className="font-serif text-lg font-semibold">{n as number}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gold-border bg-surface overflow-hidden shadow-notary">
        <div className="px-6 py-5 border-b border-gold-border">
          <h2 className="text-[13px] font-bold tracking-tight text-ink uppercase">Fiches récentes (toutes équipes)</h2>
        </div>
        {data.recentFiches.length === 0 ? (
          <div className="p-10 text-center text-ink-3">Aucune fiche récente</div>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "#182032" }}>
              <tr className="text-left text-[10px] font-mono uppercase tracking-[0.12em] text-ink-3 border-b border-gold-border">
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Client</th>
                <th className="px-6 py-3 font-medium">Année</th>
                <th className="px-6 py-3 font-medium">Statut</th>
                <th className="px-6 py-3 font-medium text-right">Montant brut</th>
              </tr>
            </thead>
            <tbody>
              {data.recentFiches.map((f: any) => (
                <tr key={f.id} className="border-b border-gold-border last:border-none hover:bg-surface-2">
                  <td className="px-6 py-4 font-mono text-xs text-ink-2">
                    {new Date(f.created_at).toLocaleDateString("fr-BE")}
                  </td>
                  <td className="px-6 py-4 text-ink">{f.clients?.name ?? "—"}</td>
                  <td className="px-6 py-4 font-mono text-xs text-ink-2">{f.year}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex text-[11px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm border text-primary"
                      style={{ backgroundColor: "rgba(201,164,92,0.10)", borderColor: "rgba(201,164,92,0.28)" }}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-serif">
                    {new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(Number(f.montant_brut ?? 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* -------------------- Users -------------------- */
function UsersTab() {
  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const grant = useServerFn(grantAdmin);
  const revoke = useServerFn(revokeAdmin);
  const del = useServerFn(deleteUser);
  const [query, setQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => list(),
  });

  const grantM = useMutation({
    mutationFn: (userId: string) => grant({ data: { userId } }),
    onSuccess: () => { toast.success("Rôle admin attribué"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast.error(e.message ?? "Erreur"),
  });
  const revokeM = useMutation({
    mutationFn: (userId: string) => revoke({ data: { userId } }),
    onSuccess: () => { toast.success("Rôle admin retiré"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast.error(e.message ?? "Erreur"),
  });
  const delM = useMutation({
    mutationFn: (userId: string) => del({ data: { userId } }),
    onSuccess: () => { toast.success("Utilisateur supprimé"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast.error(e.message ?? "Erreur"),
  });

  const users = (data ?? []).filter((u) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (u.email ?? "").toLowerCase().includes(q) || (u.full_name ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="rounded-lg border border-gold-border bg-surface overflow-hidden shadow-notary">
      <div className="px-6 py-5 border-b border-gold-border flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[13px] font-bold tracking-tight text-ink uppercase">Gestion des utilisateurs</h2>
          <p className="text-sm text-ink-3 mt-1">{users.length} utilisateur(s)</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher email ou nom…"
            className="pl-9 pr-3 py-2 text-sm bg-bg border border-gold-border rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-ink-3">Chargement…</div>
      ) : users.length === 0 ? (
        <div className="p-10 text-center text-ink-3">Aucun utilisateur</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "#182032" }}>
              <tr className="text-left text-[10px] font-mono uppercase tracking-[0.12em] text-ink-3 border-b border-gold-border">
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Cabinet</th>
                <th className="px-6 py-3 font-medium">Rôles</th>
                <th className="px-6 py-3 font-medium text-right">Clients</th>
                <th className="px-6 py-3 font-medium text-right">Fiches</th>
                <th className="px-6 py-3 font-medium">Dernière connexion</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isAdmin = u.roles.includes("admin");
                return (
                  <tr key={u.id} className="border-b border-gold-border last:border-none hover:bg-surface-2">
                    <td className="px-6 py-4">
                      <div className="text-ink">{u.email}</div>
                      {u.full_name && <div className="text-xs text-ink-3">{u.full_name}</div>}
                    </td>
                    <td className="px-6 py-4 text-ink-2">{u.cabinet ?? "—"}</td>
                    <td className="px-6 py-4">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm border text-primary"
                          style={{ backgroundColor: "rgba(201,164,92,0.10)", borderColor: "rgba(201,164,92,0.28)" }}>
                          <Shield className="w-3 h-3" /> admin
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-ink-3">user</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-serif">{u.clients_count}</td>
                    <td className="px-6 py-4 text-right font-serif">{u.fiches_count}</td>
                    <td className="px-6 py-4 font-mono text-xs text-ink-3">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("fr-BE") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin ? (
                          <button
                            onClick={() => revokeM.mutate(u.id)}
                            disabled={revokeM.isPending}
                            title="Retirer admin"
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-gold-border rounded text-ink-2 hover:text-ink hover:border-primary transition"
                          >
                            <ShieldOff className="w-3.5 h-3.5" /> Retirer admin
                          </button>
                        ) : (
                          <button
                            onClick={() => grantM.mutate(u.id)}
                            disabled={grantM.isPending}
                            title="Promouvoir admin"
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-gold-border rounded text-primary hover:bg-primary/10 transition"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Promouvoir
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Supprimer définitivement ${u.email} et toutes ses données ?`)) {
                              delM.mutate(u.id);
                            }
                          }}
                          disabled={delM.isPending}
                          title="Supprimer"
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-gold-border rounded text-destructive hover:bg-destructive/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* -------------------- Audit -------------------- */
function AuditTab() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const logs = (data ?? []).filter((l: any) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (l.action ?? "").toLowerCase().includes(q) ||
      (l.actor_email ?? "").toLowerCase().includes(q) ||
      (l.resource_type ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="rounded-lg border border-gold-border bg-surface overflow-hidden shadow-notary">
      <div className="px-6 py-5 border-b border-gold-border flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[13px] font-bold tracking-tight text-ink uppercase">Journal d'audit</h2>
          <p className="text-sm text-ink-3 mt-1">200 dernières actions</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer action, email…"
            className="pl-9 pr-3 py-2 text-sm bg-bg border border-gold-border rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-ink-3">Chargement…</div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center">
          <ScrollText className="w-10 h-10 text-ink-3 mx-auto mb-3" />
          <p className="text-ink-2">Aucune action enregistrée.</p>
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
                <tr key={l.id} className="border-b border-gold-border last:border-none hover:bg-surface-2">
                  <td className="px-6 py-4 font-mono text-xs text-ink-2">
                    {new Date(l.created_at).toLocaleString("fr-BE")}
                  </td>
                  <td className="px-6 py-4 text-ink font-mono text-xs">{l.actor_email ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center text-[11px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm border text-primary"
                      style={{ backgroundColor: "rgba(201,164,92,0.10)", borderColor: "rgba(201,164,92,0.28)" }}>
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
  );
}
