import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import {
  Zap, BatteryCharging, Wallet, Leaf, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Sun, Home, Car, Cpu,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Voltra" },
      { name: "description", content: "Visualisez votre consommation, production et économies en temps réel." },
    ],
  }),
  component: Dashboard,
});

const metrics = [
  { label: "Énergie économisée", value: "248 kWh", delta: "+12.4%", up: true, icon: Leaf, hint: "Ce mois-ci" },
  { label: "Consommation actuelle", value: "1.84 kW", delta: "−8.1%", up: false, icon: Zap, hint: "En direct" },
  { label: "Solde wallet", value: "€ 142.60", delta: "+€18.20", up: true, icon: Wallet, hint: "Revenus surplus" },
  { label: "Batterie", value: "87%", delta: "Charge", up: true, icon: BatteryCharging, hint: "Tesla Powerwall" },
];

const activities = [
  { t: "08:42", src: "Panneaux solaires", amt: "+2.4 kWh", type: "Production", status: "ok", icon: Sun },
  { t: "08:15", src: "Chauffe-eau", amt: "−1.2 kWh", type: "Consommation", status: "ok", icon: Home },
  { t: "07:58", src: "Recharge Tesla", amt: "−7.8 kWh", type: "Véhicule", status: "warn", icon: Car },
  { t: "07:30", src: "Vente au réseau", amt: "+€ 3.20", type: "Wallet", status: "ok", icon: Wallet },
  { t: "06:12", src: "Box domotique", amt: "−0.4 kWh", type: "Système", status: "ok", icon: Cpu },
  { t: "05:00", src: "Pic tarifaire évité", amt: "+€ 1.10", type: "Optimisation IA", status: "ok", icon: Zap },
];

function Sparkline() {
  // simple SVG line
  const pts = [10, 24, 18, 36, 28, 44, 32, 52, 40, 60, 48, 72, 58, 80, 70, 90];
  const w = 600, h = 140;
  const max = Math.max(...pts);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${(i / (pts.length - 1)) * w} ${h - (p / max) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgb(6,182,212)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="rgb(6,182,212)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#g)" />
      <path d={path} fill="none" stroke="rgb(34,211,238)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Dashboard() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Welcome */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-500">Bonjour, Alex</p>
            <h1 className="text-4xl font-extrabold tracking-tight mt-1">
              Votre maison fonctionne à <span className="text-cyan-400 text-glow-cyan">74% en autoconsommation</span>
            </h1>
            <p className="text-zinc-400 mt-2">Aujourd'hui, vous avez évité l'équivalent de 3.2 kg de CO₂.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/30 text-sm hover:bg-white/5 transition-colors">Exporter</button>
            <button className="px-4 py-2 rounded-xl bg-cyan-500 text-zinc-950 font-semibold text-sm hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              + Ajouter un appareil
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
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
                    m.up ? "text-emerald-300 bg-emerald-400/10 border border-emerald-400/20"
                         : "text-rose-300 bg-rose-400/10 border border-rose-400/20"
                  }`}>
                    {m.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {m.delta}
                  </span>
                </div>
                <div className="mt-5 text-3xl font-bold tracking-tight">{m.value}</div>
                <div className="mt-1 text-sm text-zinc-400">{m.label}</div>
                <div className="mt-3 text-xs text-zinc-500">{m.hint}</div>
              </div>
            );
          })}
        </div>

        {/* Chart + sidebar */}
        <div className="mt-8 grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Production vs Consommation</h2>
                <p className="text-sm text-zinc-500">Dernières 24 heures</p>
              </div>
              <div className="flex gap-1 text-xs">
                {["24h", "7j", "30j", "1an"].map((p, i) => (
                  <button key={p} className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    i === 0 ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/30" : "text-zinc-400 hover:bg-white/5"
                  }`}>{p}</button>
                ))}
              </div>
            </div>
            <Sparkline />
            <div className="flex gap-6 text-xs text-zinc-400 mt-2">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Production solaire</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-zinc-500" /> Consommation foyer</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-semibold tracking-tight">État du système</h2>
            <ul className="mt-4 space-y-4 text-sm">
              {[
                { l: "Onduleur Fronius", s: "Optimal", tone: "ok" },
                { l: "Batterie Powerwall", s: "Charge 87%", tone: "ok" },
                { l: "Compteur Linky", s: "Connecté", tone: "ok" },
                { l: "Borne Wallbox", s: "Veille", tone: "warn" },
              ].map((r) => (
                <li key={r.l} className="flex items-center justify-between">
                  <span className="text-zinc-300">{r.l}</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                    r.tone === "ok" ? "text-emerald-300" : "text-amber-300"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${r.tone === "ok" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"}`} />
                    {r.s}
                  </span>
                </li>
              ))}
            </ul>
            <button className="mt-6 w-full px-4 py-2.5 rounded-xl border border-white/10 text-sm hover:bg-white/5 transition-colors">
              Configurer →
            </button>
          </div>
        </div>

        {/* Recent activity */}
        <div className="mt-8 rounded-2xl border border-white/5 bg-zinc-900/50 overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between border-b border-white/5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Activité récente</h2>
              <p className="text-sm text-zinc-500">Flux énergétiques et transactions</p>
            </div>
            <button className="text-sm text-cyan-400 hover:text-cyan-300">Voir tout →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-zinc-500 border-b border-white/5">
                  <th className="px-6 py-3 font-medium">Heure</th>
                  <th className="px-6 py-3 font-medium">Source</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium text-right">Montant</th>
                  <th className="px-6 py-3 font-medium text-right">État</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a, i) => {
                  const Icon = a.icon;
                  const positive = a.amt.startsWith("+");
                  return (
                    <tr key={i} className="border-b border-white/5 last:border-none hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{a.t}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg grid place-items-center bg-cyan-500/10 border border-cyan-400/20 text-cyan-400">
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="font-medium">{a.src}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">{a.type}</td>
                      <td className={`px-6 py-4 text-right font-semibold ${positive ? "text-emerald-300" : "text-zinc-200"}`}>
                        <span className="inline-flex items-center gap-1">
                          {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5 text-zinc-500" />}
                          {a.amt}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${
                          a.status === "ok"
                            ? "text-emerald-300 bg-emerald-400/10 border border-emerald-400/20"
                            : "text-amber-300 bg-amber-400/10 border border-amber-400/20"
                        }`}>
                          {a.status === "ok" ? "Validé" : "À vérifier"}
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
