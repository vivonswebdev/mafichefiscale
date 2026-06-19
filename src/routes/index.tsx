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
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-70 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="absolute inset-0 bg-radial-gold" />
        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-32 text-center">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border text-primary-hover text-xs font-medium"
            style={{ backgroundColor: "rgba(201,164,92,0.08)", borderColor: "rgba(201,164,92,0.28)" }}
          >
            <Sparkles className="w-3.5 h-3.5" /> Nouveau · Import Belcotax 2026
          </span>
          <h1 className="mt-6 font-serif text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
            Vos fiches <span className="text-primary italic">281.20</span>,<br/>en quelques clics.
          </h1>
          <p className="mt-6 text-lg text-ink-2 max-w-2xl mx-auto">
            mafiche.be est la plateforme tout-en-un pour les fiscalistes belges : génération de fiches 281.20,
            paie des dirigeants, suivi des clients et export Belcotax conforme.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-bold transition-all hover:brightness-110 hover:-translate-y-px"
              style={{
                background: "linear-gradient(160deg, #c9a45c, #a3823f)",
                color: "#1a1408",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              Ouvrir l’application <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-gold-border-2 hover:bg-surface-2 transition-colors font-medium text-ink"
            >
              Voir les tarifs
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px rounded-lg overflow-hidden border border-gold-border" style={{ backgroundColor: "rgba(201,164,92,0.10)" }}>
            {[
              { k: "12 400+", v: "Fiches générées" },
              { k: "850", v: "Cabinets actifs" },
              { k: "100%", v: "Conforme Belcotax" },
              { k: "−87%", v: "Temps de saisie" },
            ].map((s) => (
              <div key={s.v} className="bg-surface px-6 py-6">
                <div className="font-serif text-2xl md:text-3xl font-semibold text-primary tracking-tight">{s.k}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3 mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <h2 className="font-serif text-4xl font-semibold tracking-tight">Tout votre cabinet. <span className="text-primary italic">Une seule app.</span></h2>
          <p className="mt-4 text-ink-2">De la fiche 281.20 à la déclaration UBO, mafiche.be couvre l'ensemble du cycle fiscal du dirigeant.</p>
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
              className="rounded-lg border border-gold-border bg-surface p-[22px] shadow-notary"
            >
              <div
                className="w-11 h-11 rounded-md grid place-items-center text-primary"
                style={{ backgroundColor: "rgba(201,164,92,0.10)", border: "1px solid rgba(201,164,92,0.22)" }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="mt-5 text-[14px] font-bold tracking-tight text-ink uppercase">{t}</h3>
              <p className="mt-2 text-sm text-ink-2 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-lg border border-gold-border-2 bg-surface p-12 md:p-16 text-center shadow-notary">
          <div className="absolute inset-0 bg-radial-gold opacity-80" />
          <div className="relative">
            <Building2 className="w-10 h-10 text-primary mx-auto" />
            <h2 className="mt-4 font-serif text-3xl md:text-5xl font-semibold tracking-tight">Conçu par et pour les fiscalistes.</h2>
            <p className="mt-4 text-ink-2 max-w-xl mx-auto">Testez gratuitement pendant 14 jours. Sans carte bancaire.</p>
            <Link
              to="/app"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-md font-bold transition-all hover:brightness-110 hover:-translate-y-px"
              style={{
                background: "linear-gradient(160deg, #c9a45c, #a3823f)",
                color: "#1a1408",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
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
