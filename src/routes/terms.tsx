import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Conditions d'utilisation — mafiche.be" },
      { name: "description", content: "Conditions générales d'utilisation du service mafiche.be pour les cabinets fiscalistes belges." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">Conditions d'utilisation</h1>
        <p className="text-sm text-ink-3 font-mono mt-2">Dernière mise à jour : 23 juin 2026</p>

        <div className="mt-8 space-y-6 text-ink-2 leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-semibold text-ink">1. Objet</h2>
            <p className="mt-2">
              Les présentes conditions régissent l'accès et l'utilisation de mafiche.be, plateforme SaaS de gestion fiscale
              pour cabinets belges.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-ink">2. Compte et accès</h2>
            <p className="mt-2">
              Vous êtes responsable de la confidentialité de vos identifiants. Toute action effectuée depuis votre compte
              vous est imputable.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-ink">3. Abonnement</h2>
            <p className="mt-2">
              Le service est facturé mensuellement selon le plan choisi. L'essai de 14 jours est sans engagement et
              sans carte. Vous pouvez résilier à tout moment depuis le tableau de bord.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-ink">4. Disponibilité</h2>
            <p className="mt-2">
              Nous nous efforçons d'assurer une disponibilité maximale du service (objectif 99,5 %, SLA 99,9 % pour le plan Pro).
              Des interruptions de maintenance peuvent survenir et seront annoncées à l'avance lorsque possible.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-ink">5. Responsabilité</h2>
            <p className="mt-2">
              mafiche.be est un outil d'assistance ; la responsabilité finale des déclarations fiscales reste celle
              du professionnel utilisateur. Notre responsabilité est limitée au montant des 12 derniers mois d'abonnement.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-ink">6. Droit applicable</h2>
            <p className="mt-2">
              Droit belge. Tribunaux de Bruxelles compétents en cas de litige, sous réserve des règles impératives applicables au consommateur.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
