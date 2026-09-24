import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import {
  FileText, Users, Calculator, ArrowRight, Sparkles, ClipboardCheck,
  FileSpreadsheet, Download, Building2, Clock, Scale, BookOpen, Bot,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "mafiche.be — Le cabinet fiduciaire, dans une seule application" },
      { name: "description", content: "Dossiers clients, fiches 281.20, paie dirigeants, échéances fiscales, timesheet, documents légaux et comptabilité simplifiée. Conçu dans un cabinet belge, pour des cabinets belges." },
      { property: "og:title", content: "mafiche.be — Le cabinet fiduciaire, dans une seule application" },
      { property: "og:description", content: "Dossiers, fiches 281.20, paie dirigeants, échéances, timesheet et documents légaux." },
    ],
  }),
  component: Landing,
});

// Ce que l'application contient réellement, module par module.
// Pas de chiffre d'usage tant qu'il n'est pas mesuré : une page publique
// d'expert-comptable n'avance que ce qu'elle peut justifier.
const MODULES = [
  { i: Users, t: "Dossiers clients", d: "Sociétés, dirigeants, actionnaires, parts, NISS, registre UBO et livre des parts. Historique par dossier." },
  { i: FileText, t: "Fiches 281.20", d: "Saisie, contrôle et export au format Belcotax officiel." },
  { i: Calculator, t: "Paie dirigeants", d: "Rémunération, ATN véhicule, cotisations sociales, précompte et net en poche." },
  { i: ClipboardCheck, t: "Échéances & suivi par étapes", d: "Calendrier TVA, IPP, ISOC et clôture. Matrice clients × étapes, avec l'échéance légale en colonne." },
  { i: Clock, t: "Timesheet & honoraires", d: "Temps presté par dossier, grille de 55 tarifs, rentabilité par client et facturation." },
  { i: Scale, t: "Documents légaux", d: "22 modèles en 9 familles : contrats, mandats, PV d'assemblée, lettres de mission, attestations." },
  { i: BookOpen, t: "Comptabilité simplifiée", d: "ASBL et personnes physiques. Partie double, bilan et compte de résultat avec contrôle d'équilibre bloquant." },
  { i: Bot, t: "Agents de contrôle", d: "Six analyses locales : impayés, pièces manquantes, forfaits dépassés, dossiers dormants, échéances non pointées." },
  { i: Download, t: "Exports", d: "PDF, CSV, Excel et XML Belcotax. Sauvegarde chiffrée AES-256 exportable à tout moment." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-70 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="absolute inset-0 bg-radial-gold" />
        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-28 text-center">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border text-primary-hover text-xs font-medium"
            style={{ backgroundColor: "rgba(201,164,92,0.08)", borderColor: "rgba(201,164,92,0.28)" }}
          >
            <Sparkles className="w-3.5 h-3.5" /> Exercice 2026 · Belcotax
          </span>
          <h1 className="mt-6 font-serif text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
            Le cabinet entier,<br />dans <span className="text-primary italic">une seule</span> application.
          </h1>
          <p className="mt-6 text-lg text-ink-2 max-w-2xl mx-auto">
            Dossiers clients, fiches 281.20, paie des dirigeants, échéances fiscales, temps prestés,
            documents légaux et comptabilité simplifiée. Écrit dans un cabinet belge, pour le travail
            réel d'un cabinet belge.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-bold transition-all hover:brightness-110 hover:-translate-y-px"
              style={{
                background: "linear-gradient(160deg, #c9a45c, #a3823f)",
                color: "#1a1408",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              Ouvrir l'application <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-gold-border-2 hover:bg-surface-2 transition-colors font-medium text-ink"
            >
              Voir les tarifs
            </Link>
          </div>

          {/* Repères vérifiables, pas des chiffres d'usage inventés. */}
          <div
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px rounded-lg overflow-hidden border border-gold-border"
            style={{ backgroundColor: "rgba(201,164,92,0.10)" }}
          >
            {[
              { k: "9", v: "Modules métier" },
              { k: "281.20", v: "Export Belcotax XML" },
              { k: "AES-256", v: "Sauvegarde chiffrée" },
              { k: "Belgique", v: "Barèmes & échéances" },
            ].map((s) => (
              <div key={s.v} className="bg-surface px-6 py-6">
                <div className="font-serif text-2xl md:text-3xl font-semibold text-primary tracking-tight">{s.k}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3 mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <h2 className="font-serif text-4xl font-semibold tracking-tight">
            Du dossier client à la <span className="text-primary italic">clôture</span>.
          </h2>
          <p className="mt-4 text-ink-2">
            Une seule base, pas neuf outils qui s'ignorent. Le temps presté alimente la rentabilité,
            la rentabilité alimente les honoraires, et les échéances remontent d'elles-mêmes.
          </p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {MODULES.map(({ i: Icon, t, d }) => (
            <div key={t} className="rounded-lg border border-gold-border bg-surface p-[22px] shadow-notary">
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

      {/* CE QUE LE LOGICIEL NE FAIT PAS */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-lg border border-gold-border bg-surface p-8 md:p-10 shadow-notary">
          <div className="flex items-start gap-4">
            <FileSpreadsheet className="w-6 h-6 text-primary shrink-0 mt-1" />
            <div>
              <h2 className="font-serif text-2xl font-semibold tracking-tight">Ce que mafiche.be ne fait pas</h2>
              <p className="mt-3 text-sm text-ink-2 leading-relaxed max-w-3xl">
                L'outil calcule, met en forme et garde la trace — il ne se substitue pas au jugement
                professionnel. Il ne vérifie pas les seuils d'éligibilité à la comptabilité simplifiée
                (travailleurs, recettes, avoirs, dettes) : cette qualification engage une responsabilité
                que le logiciel ne porte pas. Les barèmes et formats sont ceux de l'exercice en cours et
                restent à contrôler avant dépôt. La facturation Peppol n'est pas couverte.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-lg border border-gold-border-2 bg-surface p-12 md:p-16 text-center shadow-notary">
          <div className="absolute inset-0 bg-radial-gold opacity-80" />
          <div className="relative">
            <Building2 className="w-10 h-10 text-primary mx-auto" />
            <h2 className="mt-4 font-serif text-3xl md:text-5xl font-semibold tracking-tight">
              Écrit dans un cabinet, pas dans un studio.
            </h2>
            <p className="mt-4 text-ink-2 max-w-xl mx-auto">
              Chaque écran vient d'un dossier qu'il a fallu traiter. Vos données restent exportables
              à tout moment, en clair ou chiffrées.
            </p>
            <Link
              to="/auth"
              search={{ next: "/app" }}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-md font-bold transition-all hover:brightness-110 hover:-translate-y-px"
              style={{
                background: "linear-gradient(160deg, #c9a45c, #a3823f)",
                color: "#1a1408",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              Créer un compte <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
