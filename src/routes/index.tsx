import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Zap, BatteryCharging, LineChart, Leaf, ArrowRight, Sparkles, ShieldCheck, Wallet } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Voltra — Pilotez votre énergie en temps réel" },
      { name: "description", content: "Plateforme énergétique nouvelle génération : suivez, optimisez et économisez votre consommation grâce à l'IA." },
      { property: "og:title", content: "Voltra — Énergie intelligente" },
      { property: "og:description", content: "Suivez, optimisez et économisez votre consommation d'énergie en temps réel." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="absolute inset-0 bg-radial-cyan" />
        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-32 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-400/5 text-cyan-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" /> Nouveau · IA prédictive énergie
          </span>
          <h1 className="mt-6 text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
            L'énergie devient <span className="text-cyan-400 text-glow-cyan">intelligente</span>.
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
            Voltra connecte vos compteurs, batteries et panneaux solaires en une seule plateforme.
            Visualisez, automatisez et réduisez votre facture jusqu'à <span className="text-white font-semibold">42%</span>.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-zinc-950 font-semibold hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_45px_rgba(6,182,212,0.75)]"
            >
              Lancer le dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/5 transition-colors font-medium"
            >
              Voir les tarifs
            </Link>
          </div>

          {/* hero metric strip */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/10">
            {[
              { k: "12 GWh", v: "Économisés en 2026" },
              { k: "98k+", v: "Foyers connectés" },
              { k: "−42%", v: "Facture moyenne" },
              { k: "24/7", v: "Pilotage IA" },
            ].map((s) => (
              <div key={s.v} className="bg-zinc-950 px-6 py-6">
                <div className="text-2xl md:text-3xl font-bold text-cyan-400 tracking-tight">{s.k}</div>
                <div className="text-xs uppercase tracking-wider text-zinc-500 mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight">Une plateforme. <span className="text-cyan-400">Tout votre écosystème.</span></h2>
          <p className="mt-4 text-zinc-400">Du panneau solaire à la voiture électrique, Voltra orchestre chaque watt avec précision.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            { i: BatteryCharging, t: "Pilotage batterie", d: "Charge intelligente au tarif le plus bas, restitution aux pics." },
            { i: LineChart, t: "Analytics temps réel", d: "Granularité 1s, alertes anomalies, comparatifs voisinage." },
            { i: Leaf, t: "Impact carbone", d: "Mesurez les kg CO₂ évités, exportez vos rapports ESG." },
            { i: Wallet, t: "Wallet énergie", d: "Vendez votre surplus sur le marché spot en un clic." },
            { i: ShieldCheck, t: "Sécurité bancaire", d: "Chiffrement AES-256, conformité RGPD & ISO 27001." },
            { i: Zap, t: "Automations", d: "Programmez vos appareils selon la météo, prix, présence." },
          ].map(({ i: Icon, t, d }) => (
            <div
              key={t}
              className="group rounded-2xl border border-white/5 bg-zinc-900/50 p-6 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-zinc-900 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl grid place-items-center bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-shadow">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{t}</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-zinc-900 to-zinc-950 p-12 md:p-16 text-center">
          <div className="absolute inset-0 bg-radial-cyan opacity-80" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Prêt à reprendre le contrôle ?</h2>
            <p className="mt-4 text-zinc-400 max-w-xl mx-auto">Connectez votre compteur en 3 minutes. Sans engagement.</p>
            <Link
              to="/dashboard"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-zinc-950 font-semibold hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.5)]"
            >
              Démarrer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
