import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Sparkles, Globe, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "À propos — Voltra" },
      { name: "description", content: "Notre mission : accélérer la transition énergétique en rendant chaque watt intelligent." },
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
            Rendre chaque <span className="text-cyan-400 text-glow-cyan">watt</span> intelligent.
          </h1>
          <p className="mt-6 text-lg text-zinc-400">
            Voltra est née d'une conviction : l'énergie de demain sera décentralisée, propre et pilotée par les utilisateurs eux-mêmes.
            Nous construisons les outils logiciels qui rendent cela possible.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24 grid md:grid-cols-3 gap-6">
        {[
          { i: Globe, k: "12 pays", v: "Déploiements en Europe" },
          { i: Users, k: "98k+", v: "Foyers actifs" },
          { i: Sparkles, k: "Série B", v: "Levée de 32M€ en 2025" },
        ].map(({ i: Icon, k, v }) => (
          <div key={v} className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 hover:-translate-y-1 hover:border-cyan-400/30 transition-all">
            <Icon className="w-5 h-5 text-cyan-400" />
            <div className="mt-4 text-3xl font-bold tracking-tight">{k}</div>
            <div className="text-sm text-zinc-400 mt-1">{v}</div>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-32 prose prose-invert">
        <h2 className="text-3xl font-bold tracking-tight">Notre histoire</h2>
        <p className="mt-4 text-zinc-400 leading-relaxed">
          Fondée en 2023 par trois ingénieurs passionnés par les réseaux électriques et l'IA, Voltra a démarré comme un projet open source
          d'optimisation de batteries domestiques. Trois ans plus tard, nous pilotons des dizaines de milliers d'installations en temps réel,
          et notre IA prédictive économise en moyenne 42% sur la facture annuelle de nos utilisateurs.
        </p>
        <p className="mt-4 text-zinc-400 leading-relaxed">
          Nous croyons qu'un avenir énergétique soutenable n'est pas un slogan — c'est une question de logiciel, de données, et de simplicité d'usage.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
