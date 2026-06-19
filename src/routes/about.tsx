import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Sparkles, ShieldCheck, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "À propos — mafiche.be" },
      { name: "description", content: "Un outil conçu par des fiscalistes pour les fiscalistes belges." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />

      <section className="relative">
        <div className="absolute inset-0 bg-radial-gold" />
        <div className="relative mx-auto max-w-4xl px-6 pt-24 pb-16 text-center">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border text-primary-hover text-xs font-medium"
            style={{ backgroundColor: "rgba(201,164,92,0.08)", borderColor: "rgba(201,164,92,0.28)" }}
          >
            <Sparkles className="w-3.5 h-3.5" /> Notre mission
          </span>
          <h1 className="mt-6 font-serif text-5xl md:text-6xl font-semibold tracking-tight leading-tight">
            Rendre la fiscalité <span className="text-primary italic">simple</span>.
          </h1>
          <p className="mt-6 text-lg text-ink-2">
            mafiche.be est né du constat qu'aucun outil belge ne couvrait sereinement la génération des fiches 281.20
            et la paie des dirigeants. Nous avons construit ce que nous voulions utiliser au quotidien.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24 grid md:grid-cols-3 gap-6">
        {[
          { i: Users, k: "850+", v: "Cabinets utilisateurs" },
          { i: ShieldCheck, k: "100%", v: "Conforme SPF Finances" },
          { i: Sparkles, k: "2023", v: "Lancé à Bruxelles" },
        ].map(({ i: Icon, k, v }) => (
          <div key={v} className="rounded-lg border border-gold-border bg-surface p-[22px] shadow-notary">
            <Icon className="w-5 h-5 text-primary" />
            <div className="mt-4 font-serif text-3xl font-semibold tracking-tight">{k}</div>
            <div className="text-sm text-ink-2 mt-1">{v}</div>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-32">
        <h2 className="font-serif text-3xl font-semibold tracking-tight">Notre histoire</h2>
        <p className="mt-4 text-ink-2 leading-relaxed">
          Fondée en 2023 par un fiscaliste et deux développeurs, mafiche.be a démarré comme un petit outil interne
          de cabinet pour automatiser la génération des fiches 281.20. Trois ans plus tard, c'est devenu la référence
          belge pour les fiduciaires qui veulent gagner du temps sans sacrifier la conformité.
        </p>
        <p className="mt-4 text-ink-2 leading-relaxed">
          Notre conviction : un fiscaliste doit pouvoir se concentrer sur le conseil, pas sur la saisie.
          C'est ce que mafiche.be rend possible.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
