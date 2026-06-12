import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Check, Zap } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Tarifs — Voltra" },
      { name: "description", content: "Des offres transparentes pour piloter votre énergie. Sans engagement." },
    ],
  }),
  component: Pricing,
});

const plans = [
  {
    name: "Découverte",
    price: "0",
    desc: "Pour démarrer et visualiser votre consommation.",
    features: ["1 compteur connecté", "Historique 30 jours", "Alertes basiques", "Support communautaire"],
    cta: "Commencer",
    featured: false,
  },
  {
    name: "Pilote",
    price: "12",
    desc: "L'essentiel pour optimiser votre foyer.",
    features: ["Jusqu'à 5 appareils", "Historique illimité", "Automations IA", "Wallet énergie", "Support 7j/7"],
    cta: "Choisir Pilote",
    featured: true,
  },
  {
    name: "Pro",
    price: "39",
    desc: "Pour les pros et installations complexes.",
    features: ["Appareils illimités", "Multi-sites", "API & exports", "Rapports ESG", "Account manager dédié"],
    cta: "Contacter",
    featured: false,
  },
];

function Pricing() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <SiteHeader />
      <section className="relative">
        <div className="absolute inset-0 bg-radial-cyan" />
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Des tarifs <span className="text-cyan-400 text-glow-cyan">simples</span>.
          </h1>
          <p className="mt-4 text-zinc-400 max-w-xl mx-auto">Sans engagement. Annulez quand vous voulez. Première économie garantie.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                p.featured
                  ? "bg-gradient-to-b from-cyan-500/10 to-zinc-900 border border-cyan-400/40 shadow-[0_0_40px_rgba(6,182,212,0.25)]"
                  : "bg-zinc-900/50 border border-white/5 hover:border-white/20"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500 text-zinc-950 text-xs font-bold">
                  <Zap className="w-3 h-3" /> Le plus populaire
                </span>
              )}
              <h3 className="text-xl font-bold tracking-tight">{p.name}</h3>
              <p className="text-sm text-zinc-400 mt-2 min-h-[40px]">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight">€{p.price}</span>
                <span className="text-zinc-500">/mois</span>
              </div>
              <button className={`mt-6 w-full px-4 py-3 rounded-xl font-semibold transition-all ${
                p.featured
                  ? "bg-cyan-500 text-zinc-950 hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  : "border border-white/10 hover:bg-white/5"
              }`}>{p.cta}</button>
              <ul className="mt-8 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                    <span className="text-zinc-300">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
