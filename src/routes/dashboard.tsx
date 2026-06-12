import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import {
  FileText, Users, Building2, Calculator, Download, Plus,
  CheckCircle2, Clock, AlertCircle, TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
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
  { label: "Masse salariale", value: "€ 4.2M", delta: "Année 2025", icon: Calculator },
];

const fiches = [
  { client: "SRL Lumière & Associés", dirigeant: "Marc Lefèvre", niss: "78.04.12-345.67", brut: "€ 124 500", statut: "validée", year: "2025" },
  { client: "BV Maes Consulting", dirigeant: "Sophie Maes", niss: "82.11.03-128.42", brut: "€ 98 200", statut: "validée", year: "2025" },
  { client: "SRL Architecture Nord", dirigeant: "Pierre Dubois", niss: "71.06.27-091.18", brut: "€ 152 000", statut: "en cours", year: "2025" },
  { client: "SA Vandenberghe Notaires", dirigeant: "Lieve Vandenberghe", niss: "69.09.14-203.55", brut: "€ 187 400", statut: "à vérifier", year: "2025" },
  { client: "SRL Studio Création", dirigeant: "Anaïs Petit", niss: "85.02.19-447.91", brut: "€ 76 800", statut: "validée", year: "2025" },
  { client: "BV Janssen Médical", dirigeant: "Tom Janssen", niss: "74.12.08-312.04", brut: "€ 215 000", statut: "en cours", year: "2025" },
];

const statutStyle: Record<string, string> = {
  "validée": "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  "en cours": "text-cyan-300 bg-cyan-400/10 border-cyan-400/20",
  "à vérifier": "text-amber-300 bg-amber-400/10 border-amber-400/20",
};

const statutIcon: Record<string, typeof CheckCircle2> = {
  "validée": CheckCircle2,
  "en cours": Clock,
  "à vérifier": AlertCircle,
};

function Dashboard() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-500">Bonjour, Maître Dupont</p>
            <h1 className="text-4xl font-extrabold tracking-tight mt-1">
              <span className="text-cyan-400 text-glow-cyan">12 fiches</span> à finaliser cette semaine
            </h1>
            <p className="text-zinc-400 mt-2">Exercice fiscal 2025 — clôture Belcotax dans 47 jours.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 hover:border-white/30 text-sm hover:bg-white/5 transition-colors">
              <Download className="w-4 h-4" /> Export Belcotax
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-zinc-950 font-semibold text-sm hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.4)]">
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
                className="group rounded-2xl border border-white/5 bg-zinc-900/50 p-5 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-zinc-900 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl grid place-items-center bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-shadow">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg text-emerald-300 bg-emerald-400/10 border border-emerald-400/20">
                    <TrendingUp className="w-3 h-3" /> {m.delta}
                  </span>
                </div>
                <div className="mt-5 text-3xl font-bold tracking-tight">{m.value}</div>
                <div className="mt-1 text-sm text-zinc-400">{m.label}</div>
              </div>
            );
          })}
        </div>

        {/* Progress + sidebar */}
        <div className="mt-8 grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Progression Belcotax 2025</h2>
                <p className="text-sm text-zinc-500">Fiches 281.20 par client</p>
              </div>
              <span className="text-cyan-400 text-2xl font-bold tracking-tight">76%</span>
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
                    <span className="text-zinc-300">{r.c}</span>
                    <span className="text-zinc-500 font-mono text-xs">{r.n}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                      style={{ width: `${r.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-semibold tracking-tight">À faire</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                { l: "Valider fiche P. Dubois", tone: "warn" },
                { l: "Importer paie SA Vandenberghe", tone: "warn" },
                { l: "Vérifier ATN Tom Janssen", tone: "ok" },
                { l: "Mettre à jour UBO Maes", tone: "ok" },
                { l: "Préparer export Belcotax", tone: "ok" },
              ].map((r, i) => (
                <li key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors">
                  <span className={`w-1.5 h-1.5 rounded-full ${r.tone === "warn" ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" : "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"}`} />
                  <span className="text-zinc-300">{r.l}</span>
                </li>
              ))}
            </ul>
            <button className="mt-6 w-full px-4 py-2.5 rounded-xl border border-white/10 text-sm hover:bg-white/5 transition-colors">
              Voir l'agenda →
            </button>
          </div>
        </div>

        {/* Fiches récentes */}
        <div className="mt-8 rounded-2xl border border-white/5 bg-zinc-900/50 overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between border-b border-white/5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Fiches 281.20 récentes</h2>
              <p className="text-sm text-zinc-500">Dernière mise à jour il y a 3 min</p>
            </div>
            <button className="text-sm text-cyan-400 hover:text-cyan-300">Voir toutes →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-zinc-500 border-b border-white/5">
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
                  return (
                    <tr key={i} className="border-b border-white/5 last:border-none hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg grid place-items-center bg-cyan-500/10 border border-cyan-400/20 text-cyan-400">
                            <Building2 className="w-4 h-4" />
                          </span>
                          <span className="font-medium">{f.client}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">{f.dirigeant}</td>
                      <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{f.niss}</td>
                      <td className="px-6 py-4 text-zinc-400">{f.year}</td>
                      <td className="px-6 py-4 text-right font-semibold text-zinc-200">{f.brut}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border ${statutStyle[f.statut]}`}>
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
