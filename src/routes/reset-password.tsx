import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isPasswordPwned } from "@/lib/hibp";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — mafiche.be" },
      { name: "description", content: "Définissez votre nouveau mot de passe mafiche.be." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase pose la session via le hash (#access_token=...&type=recovery).
    // Le client SDK le détecte automatiquement ; on attend juste que la session
    // soit présente avant d'autoriser le changement.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setReady(true);
      } else {
        timer = setTimeout(check, 300);
      }
    };
    check();
    return () => { if (timer) clearTimeout(timer); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Mot de passe : 8 caractères minimum");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      const pwned = await isPasswordPwned(password);
      if (pwned) {
        toast.error("Ce mot de passe a été retrouvé dans une fuite de données. Choisissez-en un autre.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Mot de passe mis à jour");
      navigate({ to: "/dashboard" });
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
            Nouveau mot de passe
          </h1>
          <p className="text-sm text-ink-3 mt-2">
            Choisissez un mot de passe d'au moins 8 caractères.
          </p>

          {!ready ? (
            <p className="mt-6 text-sm text-ink-3">Validation du lien…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-ink-3">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1.5 w-full px-3 py-2 rounded-md bg-surface-2 border border-gold-border text-ink focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-ink-3">
                  Confirmer
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
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
                {loading ? "..." : "Mettre à jour"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
