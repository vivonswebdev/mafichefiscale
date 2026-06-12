import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Check, FileText } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Tarifs — mafiche.be" },
      { name: "description", content: "Des offres claires pour les cabinets fiscalistes. Essai 14 jours gratuit." },
    ],
  }),
  component: Pricing,
});

const plans = [
  {
    name: "Solo",
    price: "19",
    desc: "Pour le fiscaliste indépendant.",
    features: ["Jusqu'à 10 clients", "Fiches 281.20 illimitées", "Export Belcotax XML", "Mises à jour barèmes", "Support email"],
    cta: "Commencer",
    featured: false,
  },
  {
    name: "Cabinet",
    price: "49",
    desc: "L'offre standard pour fiduciaires.",
    features: ["Clients illimités", "Paie dirigeants complète", "Récap fiscal annuel", "Multi-utilisateurs (5)", "Support 7j/7", "API import comptabilité"],
    cta: "Choisir Cabinet",
    featured: true,
  },
  {
    name: "Pro",
    price: "129",
    desc: "Pour les grands cabinets et groupes.",
    features: ["Utilisateurs illimités", "Multi-bureaux", "SSO & permissions fines", "Audit log & conformité", "Account manager dédié", "SLA 99,9%"],
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
            Des tarifs <span className="text-cyan-400 text-glow-cyan">transparents</span>.
          </h1>
          <p className="mt-4 text-zinc-400 max-w-xl mx-auto">Essai 14 jours, sans carte. Annulez à tout moment.</p>
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
                  <FileText className="w-3 h-3" /> Le plus choisi
                </span>
              )}
              <h3 className="text-xl font-bold tracking-tight">{p.name}</h3>
              <p className="text-sm text-zinc-400 mt-2 min-h-[40px]">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight">€{p.price}</span>
                <span className="text-zinc-500">/mois HT</span>
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
