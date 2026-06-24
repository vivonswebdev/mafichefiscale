import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — mafiche.be" },
      { name: "description", content: "Réinitialisez votre mot de passe mafiche.be." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Vérifiez votre boîte mail");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2.5 justify-center mb-8">
          <span
            className="grid place-items-center w-10 h-10 rounded-md font-serif font-bold"
            style={{ background: "linear-gradient(160deg, #c9a45c, #a3823f)", color: "#1a1408" }}
          >
            M
          </span>
          <span className="font-serif font-semibold text-xl">
            mafiche<span className="text-primary">.be</span>
          </span>
        </Link>

        <div className="rounded-lg border border-gold-border bg-surface p-8 shadow-notary">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Mot de passe oublié
          </h1>
          <p className="text-sm text-ink-3 mt-2">
            Recevez un lien sécurisé par email pour le réinitialiser.
          </p>

          {sent ? (
            <div className="mt-6 rounded-md border border-gold-border bg-surface-2 p-4 text-sm text-ink-2">
              Un email vient d'être envoyé à <strong>{email}</strong>. Cliquez sur le lien qu'il
              contient pour définir un nouveau mot de passe. Vérifiez vos spams si vous ne le
              voyez pas.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-ink-3">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5 w-full px-3 py-2 rounded-md bg-surface-2 border border-gold-border text-ink focus:outline-none focus:border-primary"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-md font-bold text-sm transition-all hover:brightness-110 disabled:opacity-50"
                style={{
                  background: "linear-gradient(160deg, #c9a45c, #a3823f)",
                  color: "#1a1408",
                }}
              >
                {loading ? "..." : "Envoyer le lien"}
              </button>
            </form>
          )}

          <p className="text-sm text-ink-3 text-center mt-6">
            <Link to="/auth" className="text-primary hover:text-primary-hover font-medium">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
