import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, ScrollText, Users, FileText, Download, Filter as FilterIcon, X } from "lucide-react";

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

type AuditRow = {
  id: string;
  actor_email: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: any;
  created_at: string;
};

function AdminPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [logsRes, fichesRes, clientsRes] = await Promise.all([
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("fiches").select("id", { count: "exact", head: true }),
        supabase.from("clients").select("id", { count: "exact", head: true }),
      ]);
      return {
        logs: (logsRes.data as AuditRow[] | null) ?? [],
        fichesCount: fichesRes.count ?? 0,
        clientsCount: clientsRes.count ?? 0,
      };
    },
  });

  const logs = data?.logs ?? [];

  // Filters
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [resource, setResource] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const actions = useMemo(() => Array.from(new Set(logs.map((l) => l.action))).sort(), [logs]);
  const resources = useMemo(
    () => Array.from(new Set(logs.map((l) => l.resource_type).filter(Boolean) as string[])).sort(),
    [logs],
  );

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (actor && !(l.actor_email ?? "").toLowerCase().includes(actor.toLowerCase())) return false;
      if (action && l.action !== action) return false;
      if (resource && l.resource_type !== resource) return false;
      if (from && new Date(l.created_at) < new Date(from)) return false;
      if (to && new Date(l.created_at) > new Date(to + "T23:59:59")) return false;
      return true;
    });
  }, [logs, actor, action, resource, from, to]);

  function resetFilters() {
    setActor(""); setAction(""); setResource(""); setFrom(""); setTo("");
  }

  function exportCsv() {
    const header = ["date", "acteur", "action", "ressource", "ressource_id", "details"];
    const escape = (v: unknown) => {
      const s = v == null ? "" : typeof v === "string" ? v : JSON.stringify(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const rows = filtered.map((l) =>
      [
        new Date(l.created_at).toISOString(),
        l.actor_email ?? "",
        l.action,
        l.resource_type ?? "",
        l.resource_id ?? "",
        l.details ?? {},
      ].map(escape).join(","),
    );
    const csv = "\uFEFF" + header.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasFilters = actor || action || resource || from || to;

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <span
          className="grid place-items-center w-11 h-11 rounded-md text-primary"
          style={{ backgroundColor: "rgba(201,164,92,0.10)", border: "1px solid rgba(201,164,92,0.28)" }}
          aria-hidden="true"
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
                aria-hidden="true"
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
        <div className="px-6 py-5 border-b border-gold-border flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[13px] font-bold tracking-tight text-ink uppercase">Journal d'audit</h2>
            <p className="text-sm text-ink-3 mt-1">
              {filtered.length} entrée{filtered.length > 1 ? "s" : ""}{hasFilters ? ` (sur ${logs.length})` : ""}
            </p>
          </div>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md font-bold text-sm transition-all hover:brightness-110 disabled:opacity-40"
            style={{ background: "linear-gradient(160deg, #c9a45c, #a3823f)", color: "#1a1408" }}
          >
            <Download className="w-4 h-4" /> Exporter CSV
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gold-border bg-surface-2/30">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-ink-3 mb-3">
            <FilterIcon className="w-3 h-3" /> Filtres
            {hasFilters && (
              <button
                onClick={resetFilters}
                className="ml-auto inline-flex items-center gap-1 normal-case text-primary hover:text-primary-hover"
              >
                <X className="w-3 h-3" /> Réinitialiser
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Field label="Acteur (email)">
              <input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="ex: kaillani@..." className="filter-input" />
            </Field>
            <Field label="Action">
              <select value={action} onChange={(e) => setAction(e.target.value)} className="filter-input">
                <option value="">Toutes</option>
                {actions.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Ressource">
              <select value={resource} onChange={(e) => setResource(e.target.value)} className="filter-input">
                <option value="">Toutes</option>
                {resources.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Date depuis">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="filter-input" />
            </Field>
            <Field label="Date jusqu'à">
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="filter-input" />
            </Field>
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-ink-3">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="w-10 h-10 text-ink-3 mx-auto mb-3" aria-hidden="true" />
            <p className="text-ink-2">{hasFilters ? "Aucune entrée ne correspond aux filtres." : "Aucune action enregistrée."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: "#182032" }}>
                <tr className="text-left text-[10px] font-mono uppercase tracking-[0.12em] text-ink-3 border-b border-gold-border">
                  <th scope="col" className="px-6 py-3 font-medium">Date</th>
                  <th scope="col" className="px-6 py-3 font-medium">Acteur</th>
                  <th scope="col" className="px-6 py-3 font-medium">Action</th>
                  <th scope="col" className="px-6 py-3 font-medium">Ressource</th>
                  <th scope="col" className="px-6 py-3 font-medium">Détails</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 200).map((l) => (
                  <tr key={l.id} className="border-b border-gold-border last:border-none hover:bg-surface-2 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-ink-2">{new Date(l.created_at).toLocaleString("fr-BE")}</td>
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
            {filtered.length > 200 && (
              <p className="px-6 py-3 text-xs text-ink-3 text-center border-t border-gold-border">
                Affichage des 200 premières lignes — affinez les filtres ou exportez en CSV.
              </p>
            )}
          </div>
        )}
      </div>

      <style>{`
        .filter-input {
          width: 100%;
          padding: 0.5rem 0.625rem;
          border-radius: 0.375rem;
          background: var(--color-surface-2, #182032);
          border: 1px solid rgba(201,164,92,0.18);
          color: inherit;
          font-size: 0.8125rem;
          outline: none;
        }
        .filter-input:focus { border-color: #c9a45c; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-wider text-ink-3 mb-1">{label}</span>
      {children}
    </label>
  );
}
