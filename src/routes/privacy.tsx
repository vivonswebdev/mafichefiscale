import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — mafiche.be" },
      { name: "description", content: "Comment mafiche.be collecte, utilise et protège vos données personnelles et celles de vos clients." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">Politique de confidentialité</h1>
        <p className="text-sm text-ink-3 font-mono mt-2">Dernière mise à jour : 23 juin 2026</p>

        <div className="mt-8 space-y-6 text-ink-2 leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-semibold text-ink">1. Responsable de traitement</h2>
            <p className="mt-2">
              mafiche.be (« nous ») agit en qualité de sous-traitant au sens du RGPD pour les données de vos clients,
              et en qualité de responsable de traitement pour les données du compte utilisateur du cabinet.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-ink">2. Données collectées</h2>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Données de compte : email, nom, cabinet, mot de passe haché.</li>
              <li>Données clients que vous saisissez : raison sociale, BCE, NISS dirigeants, montants bruts.</li>
              <li>Données techniques : adresse IP, journaux d'accès, journaux d'audit administratif.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-ink">3. Finalités</h2>
            <p className="mt-2">
              Fournir le service (génération de fiches 281.20, paie dirigeants), assurer la sécurité, prévenir la fraude,
              répondre aux obligations légales belges et au RGPD.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-ink">4. Hébergement</h2>
            <p className="mt-2">
              Les données sont hébergées dans l'Union européenne. Aucun transfert hors UE n'est effectué sans cadre légal approprié.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-ink">5. Vos droits</h2>
            <p className="mt-2">
              Accès, rectification, effacement, portabilité, opposition. Pour exercer ces droits, écrivez à{" "}
              <a href="mailto:privacy@mafiche.be" className="text-primary hover:text-primary-hover">privacy@mafiche.be</a>.
              Vous pouvez aussi introduire une réclamation auprès de l'Autorité de protection des données belge.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-ink">6. Conservation</h2>
            <p className="mt-2">
              Les données comptables sont conservées 7 ans conformément à la législation belge. Les données de compte sont supprimées
              dans les 30 jours suivant la résiliation, hors obligations légales.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
