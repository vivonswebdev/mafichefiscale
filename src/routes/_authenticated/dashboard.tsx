import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Users, Building2, Calculator, Plus,
  CheckCircle2, Clock, AlertCircle, TrendingUp,
  Activity, Radio, ChevronLeft, ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — mafiche.be" },
      { name: "description", content: "Vue d'ensemble de vos clients, fiches 281.20 et déclarations en cours." },
    ],
  }),
  component: Dashboard,
});

const statutStyle: Record<string, { color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  validée:      { color: "#9ec5ad", bg: "rgba(107,156,124,0.12)", border: "rgba(107,156,124,0.28)", icon: CheckCircle2 },
  "en cours":   { color: "#9ed1c9", bg: "rgba(91,158,150,0.12)",  border: "rgba(91,158,150,0.28)", icon: Clock },
  "à vérifier": { color: "#e4c382", bg: "rgba(214,162,74,0.12)",  border: "rgba(214,162,74,0.30)", icon: AlertCircle },
  brouillon:    { color: "#c9c0a8", bg: "rgba(201,164,92,0.10)",  border: "rgba(201,164,92,0.22)", icon: Clock },
};

type ActivityType = "fiche" | "client" | "dirigeant";
type ActivityRow = {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  status?: string;
  amount?: number;
  created_at: string;
};

const PAGE_SIZE = 8;

function startOfWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d.toISOString();
}

function Dashboard() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const weekStart = startOfWeek();
      const [fichesRes, clientsRes, dirigeantsRes, profileRes, weekRes] = await Promise.all([
        supabase.from("fiches").select("*, clients(name), dirigeants(first_name,last_name,niss)").order("created_at", { ascending: false }),
        supabase.from("clients").select("*").order("created_at", { ascending: false }),
        supabase.from("dirigeants").select("*, clients(name)").order("created_at", { ascending: false }),
        supabase.auth.getUser().then(async ({ data }) => {
          if (!data.user) return null;
          const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
          return p;
        }),
        supabase.from("fiches").select("id", { count: "exact", head: true }).gte("created_at", weekStart),
      ]);
      return {
        fiches: fichesRes.data ?? [],
        clients: clientsRes.data ?? [],
        dirigeants: dirigeantsRes.data ?? [],
        profile: profileRes,
        weekFiches: weekRes.count ?? 0,
      };
    },
  });

  // Realtime: invalidate dashboard on any data change
  useEffect(() => {
    const ch = supabase
      .channel("dashboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "fiches" }, () =>
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () =>
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "dirigeants" }, () =>
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const fiches = data?.fiches ?? [];
  const clients = data?.clients ?? [];
  const dirigeants = data?.dirigeants ?? [];
  const totalBrut = fiches.reduce((s, f: any) => s + Number(f.montant_brut || 0), 0);
  const toValidate = fiches.filter((f: any) => f.status === "brouillon" || f.status === "à vérifier").length;
  const missingBce = clients.filter((c: any) => !c.bce).length;
  const greeting = data?.profile?.full_name ? `Maître ${data.profile.full_name}` : "Bienvenue";

  const kpis = [
    { label: "Fiches à valider", value: String(toValidate), icon: AlertCircle, hint: "brouillons + à vérifier" },
    { label: "Fiches cette semaine", value: String(data?.weekFiches ?? 0), icon: TrendingUp, hint: "nouvelles entrées" },
    { label: "Masse salariale", value: `€ ${totalBrut.toLocaleString("fr-BE")}`, icon: Calculator, hint: "cumul brut" },
    { label: "Alertes BCE", value: String(missingBce), icon: Building2, hint: "clients sans numéro" },
  ];

  // ----- Recent activities (unified feed) -----
  const activities: ActivityRow[] = useMemo(() => {
    const f: ActivityRow[] = fiches.map((x: any) => ({
      id: `f-${x.id}`,
      type: "fiche",
      title: `Fiche 281.20 · ${x.clients?.name ?? "Client supprimé"}`,
      subtitle: `${x.year} · ${x.dirigeants ? `${x.dirigeants.first_name ?? ""} ${x.dirigeants.last_name ?? ""}`.trim() : "—"}`,
      status: x.status,
      amount: Number(x.montant_brut || 0),
      created_at: x.created_at,
    }));
    const c: ActivityRow[] = clients.map((x: any) => ({
      id: `c-${x.id}`,
      type: "client",
      title: `Client ajouté · ${x.name}`,
      subtitle: x.bce ? `BCE ${x.bce}` : "Sans BCE",
      created_at: x.created_at,
    }));
    const d: ActivityRow[] = dirigeants.map((x: any) => ({
      id: `d-${x.id}`,
      type: "dirigeant",
      title: `Dirigeant · ${x.first_name ?? ""} ${x.last_name ?? ""}`.trim(),
      subtitle: `${x.clients?.name ?? "—"}${x.niss ? ` · ${x.niss}` : ""}`,
      created_at: x.created_at,
    }));
    return [...f, ...c, ...d].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }, [fiches, clients, dirigeants]);

  const [typeFilter, setTypeFilter] = useState<"all" | ActivityType>("all");
  const [page, setPage] = useState(1);
  const filtered = useMemo(
    () => (typeFilter === "all" ? activities : activities.filter((a) => a.type === typeFilter)),
    [activities, typeFilter],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => { setPage(1); }, [typeFilter]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-ink-3 font-mono uppercase tracking-wider flex items-center gap-2">
            Bonjour, {greeting}
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300/90 normal-case font-sans">
              <Radio className="w-3 h-3 animate-pulse" /> live
            </span>
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight mt-2">
            Votre <span className="text-primary">cabinet</span> en un coup d'œil
          </h1>
          <p className="text-ink-2 mt-2">Exercice fiscal 2025 — données synchronisées en temps réel.</p>
        </div>
        <Link
          to="/clients"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all hover:brightness-110 hover:-translate-y-px"
          style={{ background: "linear-gradient(160deg, #c9a45c, #a3823f)", color: "#1a1408" }}
        >
          <Plus className="w-4 h-4" /> Gérer mes clients
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-lg border border-gold-border bg-surface p-[22px] shadow-notary">
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-md grid place-items-center text-primary"
                  style={{ backgroundColor: "rgba(201,164,92,0.10)", border: "1px solid rgba(201,164,92,0.22)" }}
                  aria-hidden="true"
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-5 font-serif text-3xl font-semibold tracking-tight">{m.value}</div>
              <div className="mt-1 text-sm text-ink-2">{m.label}</div>
              <div className="mt-0.5 text-[11px] font-mono uppercase tracking-wider text-ink-3">{m.hint}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        {/* Activities */}
        <section className="rounded-lg border border-gold-border bg-surface overflow-hidden shadow-notary">
          <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3 border-b border-gold-border">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" aria-hidden="true" />
              <h2 className="text-[13px] font-bold tracking-tight text-ink uppercase">Activités récentes</h2>
            </div>
            <div role="tablist" aria-label="Filtrer par type" className="inline-flex rounded-md border border-gold-border overflow-hidden text-xs">
              {([
                { id: "all", label: "Tout" },
                { id: "fiche", label: "Fiches" },
                { id: "client", label: "Clients" },
                { id: "dirigeant", label: "Dirigeants" },
              ] as const).map((t) => {
                const active = typeFilter === t.id;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTypeFilter(t.id)}
                    className={`px-3 py-1.5 transition-colors ${active ? "text-primary" : "text-ink-3 hover:text-ink"}`}
                    style={active ? { backgroundColor: "rgba(201,164,92,0.14)" } : undefined}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-ink-3">Chargement…</div>
          ) : visible.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-10 h-10 text-ink-3 mx-auto mb-3" aria-hidden="true" />
              <p className="text-ink-2">Aucune activité.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gold-border">
              {visible.map((a) => (
                <li key={a.id} className="px-6 py-3 flex items-center gap-4 hover:bg-surface-2 transition-colors">
                  <span
                    className="w-9 h-9 rounded-sm grid place-items-center text-primary shrink-0"
                    style={{ backgroundColor: "rgba(201,164,92,0.10)", border: "1px solid rgba(201,164,92,0.22)" }}
                    aria-hidden="true"
                  >
                    {a.type === "fiche" ? <FileText className="w-4 h-4" /> : a.type === "client" ? <Building2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-ink truncate">{a.title}</div>
                    <div className="text-xs text-ink-3 font-mono truncate">{a.subtitle}</div>
                  </div>
                  {a.amount !== undefined && (
                    <div className="font-mono text-sm font-semibold text-ink shrink-0">€ {a.amount.toLocaleString("fr-BE")}</div>
                  )}
                  {a.status && (() => {
                    const s = statutStyle[a.status] ?? statutStyle.brouillon;
                    return (
                      <span
                        className="hidden sm:inline-flex items-center text-[10px] font-medium px-2 py-1 rounded-sm border shrink-0"
                        style={{ color: s.color, backgroundColor: s.bg, borderColor: s.border }}
                      >
                        {a.status}
                      </span>
                    );
                  })()}
                  <time className="hidden md:block text-[11px] font-mono text-ink-3 shrink-0" dateTime={a.created_at}>
                    {new Date(a.created_at).toLocaleDateString("fr-BE")}
                  </time>
                </li>
              ))}
            </ul>
          )}

          {filtered.length > PAGE_SIZE && (
            <nav aria-label="Pagination" className="px-6 py-3 border-t border-gold-border flex items-center justify-between text-xs text-ink-3">
              <span className="font-mono">
                Page {page} / {totalPages} · {filtered.length} entrées
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Page précédente"
                  className="p-1.5 rounded-md border border-gold-border-2 hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Page suivante"
                  className="p-1.5 rounded-md border border-gold-border-2 hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </nav>
          )}
        </section>

        {/* Recent fiches snapshot */}
        <section className="rounded-lg border border-gold-border bg-surface overflow-hidden shadow-notary">
          <div className="px-6 py-5 border-b border-gold-border flex items-center justify-between">
            <h2 className="text-[13px] font-bold tracking-tight text-ink uppercase">5 dernières fiches</h2>
            <Link to="/clients" className="text-xs text-primary hover:text-primary-hover">Tout gérer →</Link>
          </div>
          {fiches.length === 0 ? (
            <div className="p-10 text-center text-ink-3">Aucune fiche.</div>
          ) : (
            <ul className="divide-y divide-gold-border">
              {fiches.slice(0, 5).map((f: any) => {
                const s = statutStyle[f.status] ?? statutStyle.brouillon;
                return (
                  <li key={f.id} className="px-6 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm text-ink truncate">{f.clients?.name ?? "—"}</div>
                        <div className="text-[11px] font-mono text-ink-3 truncate">
                          {f.year} · €{Number(f.montant_brut).toLocaleString("fr-BE")}
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-medium px-2 py-1 rounded-sm border shrink-0"
                        style={{ color: s.color, backgroundColor: s.bg, borderColor: s.border }}
                      >
                        {f.status}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
