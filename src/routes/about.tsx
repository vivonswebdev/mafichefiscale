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
    <div className="min-h-screen bg-zinc-950 text-white">
      <SiteHeader />

      <section className="relative">
        <div className="absolute inset-0 bg-radial-cyan" />
        <div className="relative mx-auto max-w-4xl px-6 pt-24 pb-16 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/30 bg-cyan-400/5 text-cyan-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" /> Notre mission
          </span>
          <h1 className="mt-6 text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Rendre la fiscalité <span className="text-cyan-400 text-glow-cyan">simple</span>.
          </h1>
          <p className="mt-6 text-lg text-zinc-400">
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
          <div key={v} className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 hover:-translate-y-1 hover:border-cyan-400/30 transition-all">
            <Icon className="w-5 h-5 text-cyan-400" />
            <div className="mt-4 text-3xl font-bold tracking-tight">{k}</div>
            <div className="text-sm text-zinc-400 mt-1">{v}</div>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-32">
        <h2 className="text-3xl font-bold tracking-tight">Notre histoire</h2>
        <p className="mt-4 text-zinc-400 leading-relaxed">
          Fondée en 2023 par un fiscaliste et deux développeurs, mafiche.be a démarré comme un petit outil interne
          de cabinet pour automatiser la génération des fiches 281.20. Trois ans plus tard, c'est devenu la référence
          belge pour les fiduciaires qui veulent gagner du temps sans sacrifier la conformité.
        </p>
        <p className="mt-4 text-zinc-400 leading-relaxed">
          Notre conviction : un fiscaliste doit pouvoir se concentrer sur le conseil, pas sur la saisie.
          C'est ce que mafiche.be rend possible.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
