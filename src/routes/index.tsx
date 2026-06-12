import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import {
  FileText, Users, Calculator, ShieldCheck, ArrowRight, Sparkles,
  FileSpreadsheet, Download, Building2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "mafiche.be — Fiches 281.20 & paie dirigeants" },
      { name: "description", content: "Le logiciel des fiscalistes belges : générez vos fiches 281.20, gérez la paie des dirigeants et vos clients en quelques clics." },
      { property: "og:title", content: "mafiche.be — L'app des fiscalistes" },
      { property: "og:description", content: "Générez vos fiches 281.20 et la paie des dirigeants en quelques clics." },
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
            <Sparkles className="w-3.5 h-3.5" /> Nouveau · Import Belcotax 2026
          </span>
          <h1 className="mt-6 text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
            Vos fiches <span className="text-cyan-400 text-glow-cyan">281.20</span>,<br/>en quelques clics.
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
            mafiche.be est la plateforme tout-en-un pour les fiscalistes belges : génération de fiches 281.20,
            paie des dirigeants, suivi des clients et export Belcotax conforme.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-zinc-950 font-semibold hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_45px_rgba(6,182,212,0.75)]"
            >
              Ouvrir le dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/5 transition-colors font-medium"
            >
              Voir les tarifs
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/10">
            {[
              { k: "12 400+", v: "Fiches générées" },
              { k: "850", v: "Cabinets actifs" },
              { k: "100%", v: "Conforme Belcotax" },
              { k: "−87%", v: "Temps de saisie" },
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
          <h2 className="text-4xl font-bold tracking-tight">Tout votre cabinet. <span className="text-cyan-400">Une seule app.</span></h2>
          <p className="mt-4 text-zinc-400">De la fiche 281.20 à la déclaration UBO, mafiche.be couvre l'ensemble du cycle fiscal du dirigeant.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            { i: FileText, t: "Fiches 281.20", d: "Générez, validez et exportez vos fiches au format Belcotax officiel." },
            { i: Calculator, t: "Paie dirigeants", d: "Calcul automatique rémunération, ATN, cotisations, précompte et net en poche." },
            { i: Users, t: "Gestion clients", d: "Centralisez sociétés, dirigeants, NISS, parts, UBO et notes." },
            { i: FileSpreadsheet, t: "Récap fiscal annuel", d: "Vue d'ensemble du revenu imposable net par dirigeant, prêt pour l'IPP." },
            { i: ShieldCheck, t: "Conformité garantie", d: "Mises à jour automatiques des barèmes et formats SPF Finances." },
            { i: Download, t: "Export PDF & XML", d: "Téléchargez fiches imprimables et déclarations Belcotax en un clic." },
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
            <Building2 className="w-10 h-10 text-cyan-400 mx-auto" />
            <h2 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">Conçu par et pour les fiscalistes.</h2>
            <p className="mt-4 text-zinc-400 max-w-xl mx-auto">Testez gratuitement pendant 14 jours. Sans carte bancaire.</p>
            <Link
              to="/dashboard"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-zinc-950 font-semibold hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.5)]"
            >
              Démarrer l'essai gratuit <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
