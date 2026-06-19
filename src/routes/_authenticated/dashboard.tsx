import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import {
  FileText, Users, Building2, Calculator, Download, Plus,
  CheckCircle2, Clock, AlertCircle, TrendingUp,
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

const metrics = [
  { label: "Fiches 281.20 générées", value: "248", delta: "+18 ce mois", icon: FileText },
  { label: "Clients actifs", value: "42", delta: "+3 ce mois", icon: Building2 },
  { label: "Dirigeants suivis", value: "97", delta: "+5 ce mois", icon: Users },
  { label: "Masse salariale", value: "€ 4 200 000", delta: "Année 2025", icon: Calculator },
];

const fiches = [
  { client: "SRL Lumière & Associés", dirigeant: "Marc Lefèvre", niss: "78.04.12-345.67", brut: "€ 124 500", statut: "validée", year: "2025" },
  { client: "BV Maes Consulting", dirigeant: "Sophie Maes", niss: "82.11.03-128.42", brut: "€ 98 200", statut: "validée", year: "2025" },
  { client: "SRL Architecture Nord", dirigeant: "Pierre Dubois", niss: "71.06.27-091.18", brut: "€ 152 000", statut: "en cours", year: "2025" },
  { client: "SA Vandenberghe Notaires", dirigeant: "Lieve Vandenberghe", niss: "69.09.14-203.55", brut: "€ 187 400", statut: "à vérifier", year: "2025" },
  { client: "SRL Studio Création", dirigeant: "Anaïs Petit", niss: "85.02.19-447.91", brut: "€ 76 800", statut: "validée", year: "2025" },
  { client: "BV Janssen Médical", dirigeant: "Tom Janssen", niss: "74.12.08-312.04", brut: "€ 215 000", statut: "en cours", year: "2025" },
];

const statutStyle: Record<string, { color: string; bg: string; border: string }> = {
  "validée":    { color: "#9ec5ad", bg: "rgba(107,156,124,0.12)", border: "rgba(107,156,124,0.28)" },
  "en cours":   { color: "#9ed1c9", bg: "rgba(91,158,150,0.12)",  border: "rgba(91,158,150,0.28)" },
  "à vérifier": { color: "#e4c382", bg: "rgba(214,162,74,0.12)",  border: "rgba(214,162,74,0.30)" },
};

const statutIcon: Record<string, typeof CheckCircle2> = {
  "validée": CheckCircle2,
  "en cours": Clock,
  "à vérifier": AlertCircle,
};

function Dashboard() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-sm text-ink-3 font-mono uppercase tracking-wider">Bonjour, Maître Dupont</p>
            <h1 className="font-serif text-4xl font-semibold tracking-tight mt-2">
              <span className="text-primary">12 fiches</span> à finaliser cette semaine
            </h1>
            <p className="text-ink-2 mt-2">Exercice fiscal 2025 — clôture Belcotax dans <span className="font-mono text-ink">47</span> jours.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gold-border-2 text-sm text-ink hover:bg-surface-2 transition-colors">
              <Download className="w-4 h-4" /> Export Belcotax
            </button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all hover:brightness-110 hover:-translate-y-px"
              style={{
                background: "linear-gradient(160deg, #c9a45c, #a3823f)",
                color: "#1a1408",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              <Plus className="w-4 h-4" /> Nouvelle fiche
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="rounded-lg border border-gold-border bg-surface p-[22px] shadow-notary"
              >
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
                    <TrendingUp className="w-3 h-3" /> {m.delta}
                  </span>
                </div>
                <div className="mt-5 font-serif text-3xl font-semibold tracking-tight text-ink">{m.value}</div>
                <div className="mt-1 text-sm text-ink-2">{m.label}</div>
              </div>
            );
          })}
        </div>

        {/* Progress + sidebar */}
        <div className="mt-8 grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-lg border border-gold-border bg-surface p-6 shadow-notary">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[13px] font-bold tracking-tight text-ink uppercase">Progression Belcotax 2025</h2>
                <p className="text-sm text-ink-3 mt-1">Fiches 281.20 par client</p>
              </div>
              <span className="font-serif text-primary text-2xl font-semibold tracking-tight">76%</span>
            </div>
            <div className="mt-6 space-y-4">
              {[
                { c: "SRL Lumière & Associés", pct: 100, n: "4/4" },
                { c: "BV Maes Consulting", pct: 100, n: "2/2" },
                { c: "SRL Architecture Nord", pct: 66, n: "2/3" },
                { c: "SA Vandenberghe Notaires", pct: 50, n: "1/2" },
                { c: "SRL Studio Création", pct: 100, n: "1/1" },
                { c: "BV Janssen Médical", pct: 33, n: "1/3" },
              ].map((r) => (
                <div key={r.c}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-ink">{r.c}</span>
                    <span className="text-ink-3 font-mono text-xs">{r.n}</span>
                  </div>
                  <div className="h-1.5 rounded-sm bg-surface-3 overflow-hidden">
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${r.pct}%`,
                        background: "linear-gradient(90deg, #a3823f, #c9a45c)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gold-border bg-surface p-6 shadow-notary">
            <h2 className="text-[13px] font-bold tracking-tight text-ink uppercase">À faire</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                { l: "Valider fiche P. Dubois", tone: "warn" },
                { l: "Importer paie SA Vandenberghe", tone: "warn" },
                { l: "Vérifier ATN Tom Janssen", tone: "ok" },
                { l: "Mettre à jour UBO Maes", tone: "ok" },
                { l: "Préparer export Belcotax", tone: "ok" },
              ].map((r, i) => (
                <li key={i} className="flex items-center gap-3 p-2.5 rounded-sm hover:bg-surface-2 transition-colors">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: r.tone === "warn" ? "#d6a24a" : "#c9a45c" }}
                  />
                  <span className="text-ink">{r.l}</span>
                </li>
              ))}
            </ul>
            <button className="mt-6 w-full px-4 py-2.5 rounded-md border border-gold-border-2 text-sm text-ink hover:bg-surface-2 transition-colors">
              Voir l'agenda →
            </button>
          </div>
        </div>

        {/* Fiches récentes */}
        <div className="mt-8 rounded-lg border border-gold-border bg-surface overflow-hidden shadow-notary">
          <div className="px-6 py-5 flex items-center justify-between border-b border-gold-border">
            <div>
              <h2 className="text-[13px] font-bold tracking-tight text-ink uppercase">Fiches 281.20 récentes</h2>
              <p className="text-sm text-ink-3 mt-1">Dernière mise à jour il y a 3 min</p>
            </div>
            <button className="text-sm text-primary hover:text-primary-hover">Voir toutes →</button>
          </div>
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
                {fiches.map((f, i) => {
                  const Icon = statutIcon[f.statut];
                  const s = statutStyle[f.statut];
                  return (
                    <tr key={i} className="border-b border-gold-border last:border-none hover:bg-surface-2 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-8 h-8 rounded-sm grid place-items-center text-primary"
                            style={{ backgroundColor: "rgba(201,164,92,0.10)", border: "1px solid rgba(201,164,92,0.22)" }}
                          >
                            <Building2 className="w-4 h-4" />
                          </span>
                          <span className="font-medium text-ink">{f.client}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-ink-2">{f.dirigeant}</td>
                      <td className="px-6 py-4 text-ink-3 font-mono text-xs">{f.niss}</td>
                      <td className="px-6 py-4 text-ink-2 font-mono">{f.year}</td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-ink">{f.brut}</td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-sm border"
                          style={{ color: s.color, backgroundColor: s.bg, borderColor: s.border }}
                        >
                          <Icon className="w-3 h-3" />
                          {f.statut}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
