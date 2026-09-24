import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Users, Building2, Calculator, Plus,
  CheckCircle2, Clock, AlertCircle, TrendingUp,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

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

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [fichesRes, clientsRes, dirigeantsRes, invoicesRes, profileRes] = await Promise.all([
        supabase.from("fiches").select("*, clients(name), dirigeants(first_name,last_name,niss)").order("created_at", { ascending: false }),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("dirigeants").select("id", { count: "exact", head: true }),
        (supabase.from("invoices") as any).select("id, client_id, amount, status, due_date"),
        supabase.auth.getUser().then(async ({ data }) => {
          if (!data.user) return null;
          const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
          return p;
        }),
      ]);
      return {
        fiches: fichesRes.data ?? [],
        clientsCount: clientsRes.count ?? 0,
        dirigeantsCount: dirigeantsRes.count ?? 0,
        invoices: (invoicesRes.data ?? []) as Array<{ id: string; client_id: string; amount: number; status: string; due_date: string | null }>,
        profile: profileRes,
      };
    },
  });

  const fiches = data?.fiches ?? [];
  const invoices = data?.invoices ?? [];
  const totalBrut = fiches.reduce((s, f: any) => s + Number(f.montant_brut || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const pendingInv = invoices.filter((i) => i.status === "pending");
  const outstandingTotal = pendingInv.reduce((s, i) => s + Number(i.amount || 0), 0);
  const overdueInv = pendingInv.filter((i) => i.due_date && i.due_date < today);
  const overdueTotal = overdueInv.reduce((s, i) => s + Number(i.amount || 0), 0);
  const greeting = data?.profile?.full_name ? `Maître ${data.profile.full_name}` : "Bienvenue";

  const metrics = [
    { label: "Fiches 281.20", value: String(fiches.length), icon: FileText },
    { label: "Clients actifs", value: String(data?.clientsCount ?? 0), icon: Building2 },
    { label: "Dirigeants suivis", value: String(data?.dirigeantsCount ?? 0), icon: Users },
    { label: "Masse salariale", value: `€ ${totalBrut.toLocaleString("fr-BE")}`, icon: Calculator },
  ];


  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-sm text-ink-3 font-mono uppercase tracking-wider">Bonjour, {greeting}</p>
            <h1 className="font-serif text-4xl font-semibold tracking-tight mt-2">
              Votre <span className="text-primary">cabinet</span> en un coup d'œil
            </h1>
            {/* Ne plus annoncer « synchronisées en temps réel » : la remontée
                vers Supabase est différée et ne couvre que les clients, les
                dirigeants et les fiches. Les chiffres ci-dessous sont donc un
                sous-ensemble de ce que contient l'application — le dire plutôt
                que laisser croire à deux vérités. */}
            <p className="text-ink-2 mt-2">Ce qui est remonté dans le cloud.</p>
          </div>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all hover:brightness-110 hover:-translate-y-px"
            style={{ background: "linear-gradient(160deg, #c9a45c, #a3823f)", color: "#1a1408" }}
          >
            <Plus className="w-4 h-4" /> Ouvrir l'application
          </Link>
        </div>

        <div
          className="mt-6 rounded-lg border p-4 text-sm text-ink-2"
          style={{ backgroundColor: "rgba(201,164,92,0.06)", borderColor: "rgba(201,164,92,0.28)" }}
        >
          <strong className="text-ink">Ces compteurs ne sont pas votre dossier complet.</strong>{" "}
          Seuls les clients, dirigeants et fiches 281.20 remontent aujourd'hui vers le cloud, et
          uniquement après une sauvegarde dans l'application. Tâches, notes, prestations, temps et
          comptabilité restent dans l'application.{" "}
          <Link to="/app" className="text-primary underline">Ouvrir l'application</Link> pour voir
          l'ensemble.
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="rounded-lg border border-gold-border bg-surface p-[22px] shadow-notary">
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 rounded-md grid place-items-center text-primary"
                    style={{ backgroundColor: "rgba(201,164,92,0.10)", border: "1px solid rgba(201,164,92,0.22)" }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-sm font-mono uppercase tracking-wider"
                    style={{ color: "#9ec5ad", backgroundColor: "rgba(107,156,124,0.12)", border: "1px solid rgba(107,156,124,0.28)" }}
                  >
                    <TrendingUp className="w-3 h-3" /> Live
                  </span>
                </div>
                <div className="mt-5 font-serif text-3xl font-semibold tracking-tight text-ink">{m.value}</div>
                <div className="mt-1 text-sm text-ink-2">{m.label}</div>
              </div>
            );
          })}
        </div>

        {/* Outstanding invoices widget */}
        <div className="mt-6 rounded-lg border border-gold-border bg-surface p-5 shadow-notary flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-md grid place-items-center"
              style={{
                color: overdueTotal > 0 ? "#e88a8a" : "#e4c382",
                backgroundColor: overdueTotal > 0 ? "rgba(180,70,70,0.14)" : "rgba(214,162,74,0.12)",
                border: `1px solid ${overdueTotal > 0 ? "rgba(180,70,70,0.32)" : "rgba(214,162,74,0.30)"}`,
              }}
            >
              {overdueTotal > 0 ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-ink-3">Encours non payés</div>
              <div className="font-serif text-2xl font-semibold mt-1">
                € {outstandingTotal.toLocaleString("fr-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-ink-3 mt-0.5">
                {pendingInv.length} facture(s) en attente
                {overdueTotal > 0 && (
                  <span className="text-red-400 ml-2">
                    · {overdueInv.length} en retard ({overdueTotal.toLocaleString("fr-BE")} €)
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            to="/invoices"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm"
            style={{ background: "linear-gradient(160deg, #c9a45c, #a3823f)", color: "#1a1408" }}
          >
            Gérer les factures →
          </Link>
        </div>



        <div className="mt-8 rounded-lg border border-gold-border bg-surface overflow-hidden shadow-notary">
          <div className="px-6 py-5 flex items-center justify-between border-b border-gold-border">
            <div>
              <h2 className="text-[13px] font-bold tracking-tight text-ink uppercase">Fiches 281.20 récentes</h2>
              <p className="text-sm text-ink-3 mt-1">Vos dernières fiches enregistrées</p>
            </div>
            <Link to="/clients" className="text-sm text-primary hover:text-primary-hover">Tout gérer →</Link>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-ink-3">Chargement…</div>
          ) : fiches.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-ink-3 mx-auto mb-3" />
              <p className="text-ink-2">Aucune fiche pour l'instant.</p>
              <Link
                to="/clients"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm"
                style={{ background: "linear-gradient(160deg, #c9a45c, #a3823f)", color: "#1a1408" }}
              >
                <Plus className="w-4 h-4" /> Créer un client
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: "#182032" }}>
                  <tr className="text-left text-[10px] font-mono uppercase tracking-[0.12em] text-ink-3 border-b border-gold-border">
                    <th className="px-6 py-3 font-medium">Client</th>
                    <th className="px-6 py-3 font-medium">Dirigeant</th>
                    <th className="px-6 py-3 font-medium">NISS</th>
                    <th className="px-6 py-3 font-medium">Année</th>
                    <th className="px-6 py-3 font-medium text-right">Rém. brute</th>
                    <th className="px-6 py-3 font-medium text-right">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {fiches.map((f: any) => {
                    const s = statutStyle[f.status] ?? statutStyle.brouillon;
                    const Icon = s.icon;
                    const dirName = f.dirigeants
                      ? `${f.dirigeants.first_name ?? ""} ${f.dirigeants.last_name ?? ""}`.trim()
                      : "—";
                    return (
                      <tr key={f.id} className="border-b border-gold-border last:border-none hover:bg-surface-2 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className="w-8 h-8 rounded-sm grid place-items-center text-primary"
                              style={{ backgroundColor: "rgba(201,164,92,0.10)", border: "1px solid rgba(201,164,92,0.22)" }}
                            >
                              <Building2 className="w-4 h-4" />
                            </span>
                            <span className="font-medium text-ink">{f.clients?.name ?? "—"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-ink-2">{dirName}</td>
                        <td className="px-6 py-4 text-ink-3 font-mono text-xs">{f.dirigeants?.niss ?? "—"}</td>
                        <td className="px-6 py-4 text-ink-2 font-mono">{f.year}</td>
                        <td className="px-6 py-4 text-right font-mono font-semibold text-ink">€ {Number(f.montant_brut).toLocaleString("fr-BE")}</td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-sm border"
                            style={{ color: s.color, backgroundColor: s.bg, borderColor: s.border }}
                          >
                            <Icon className="w-3 h-3" />
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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
