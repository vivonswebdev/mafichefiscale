import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connexion — mafiche.be" },
      { name: "description", content: "Accédez à votre cabinet mafiche.be." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [cabinet, setCabinet] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, cabinet },
          },
        });
        if (error) throw error;
        toast.success("Compte créé. Bienvenue !");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connecté");
      }
      navigate({ to: "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Échec connexion Google");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/app" });
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
            {mode === "signin" ? "Connexion à votre cabinet" : "Créer votre cabinet"}
          </h1>
          <p className="text-sm text-ink-3 mt-2">
            {mode === "signin"
              ? "Accédez à vos dossiers fiscaux."
              : "Démarrez avec mafiche.be en 30 secondes."}
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="mt-6 w-full inline-flex items-center justify-center gap-3 px-4 py-2.5 rounded-md border border-gold-border-2 text-sm text-ink hover:bg-surface-2 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29 4.5 24 4.5c-7.4 0-13.8 4.1-17.7 10.2z"/>
              <path fill="#4CAF50" d="M24 43.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.1c-2 1.4-4.5 2.3-7.2 2.3-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.8 39.3 16.3 43.5 24 43.5z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.2 5.1c-.4.4 6.6-4.8 6.6-14.5 0-1.2-.1-2.4-.4-3.5z"/>
            </svg>
            Continuer avec Google
          </button>

          <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-wider text-ink-3">
            <span className="flex-1 h-px bg-gold-border" />
            ou
            <span className="flex-1 h-px bg-gold-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-ink-3">Nom complet</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="mt-1.5 w-full px-3 py-2 rounded-md bg-surface-2 border border-gold-border text-ink focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-ink-3">Cabinet</label>
                  <input
                    type="text"
                    value={cabinet}
                    onChange={(e) => setCabinet(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2 rounded-md bg-surface-2 border border-gold-border text-ink focus:outline-none focus:border-primary"
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-ink-3">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5 w-full px-3 py-2 rounded-md bg-surface-2 border border-gold-border text-ink focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-ink-3">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? "..." : mode === "signin" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

          <p className="text-sm text-ink-3 text-center mt-6">
            {mode === "signin" ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary hover:text-primary-hover font-medium"
            >
              {mode === "signin" ? "Créer un cabinet" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
