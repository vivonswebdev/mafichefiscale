import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Check } from "lucide-react";

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
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <section className="relative">
        <div className="absolute inset-0 bg-radial-gold" />
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-12 text-center">
          <h1 className="font-serif text-5xl md:text-6xl font-semibold tracking-tight">
            Des tarifs <span className="text-primary italic">transparents</span>.
          </h1>
          <p className="mt-4 text-ink-2 max-w-xl mx-auto">Essai 14 jours, sans carte. Annulez à tout moment.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-lg p-8 shadow-notary border ${
                p.featured ? "bg-surface-2 border-gold-border-2" : "bg-surface border-gold-border"
              }`}
              style={p.featured ? { boxShadow: "0 2px 14px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(201,164,92,0.18)" } : undefined}
            >
              {p.featured && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: "linear-gradient(160deg, #c9a45c, #a3823f)", color: "#1a1408" }}
                >
                  Le plus choisi
                </span>
              )}
              <h3 className="font-serif text-2xl font-semibold tracking-tight">{p.name}</h3>
              <p className="text-sm text-ink-2 mt-2 min-h-[40px]">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-serif text-5xl font-semibold tracking-tight">€{p.price}</span>
                <span className="text-ink-3 font-mono text-xs">/mois HT</span>
              </div>
              <button
                className={`mt-6 w-full px-4 py-3 rounded-md font-bold text-sm transition-all ${
                  p.featured
                    ? "hover:brightness-110 hover:-translate-y-px"
                    : "border border-gold-border-2 text-ink hover:bg-surface-2"
                }`}
                style={
                  p.featured
                    ? {
                        background: "linear-gradient(160deg, #c9a45c, #a3823f)",
                        color: "#1a1408",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      }
                    : undefined
                }
              >
                {p.cta}
              </button>
              <ul className="mt-8 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-ink">{f}</span>
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
