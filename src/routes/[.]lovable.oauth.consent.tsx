import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type OAuthNs = {
  getAuthorizationDetails: (id: string) => Promise<{
    data?: {
      client?: { name?: string; redirect_uri?: string; client_uri?: string };
      scope?: string;
      scopes?: string[];
      redirect_url?: string;
      redirect_to?: string;
    } | null;
    error?: { message?: string } | null;
  }>;
  approveAuthorization: (id: string) => Promise<{
    data?: { redirect_url?: string; redirect_to?: string } | null;
    error?: { message?: string } | null;
  }>;
  denyAuthorization: (id: string) => Promise<{
    data?: { redirect_url?: string; redirect_to?: string } | null;
    error?: { message?: string } | null;
  }>;
};

function oauth(): OAuthNs {
  return (supabase.auth as unknown as { oauth: OAuthNs }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("authorization_id manquant");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) {
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message ?? "Erreur d'autorisation");
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) {
      window.location.href = immediate;
      throw redirect({ to: "/" });
    }
    return data ?? {};
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen bg-bg text-ink flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl">Autorisation impossible</h1>
        <p className="mt-3 text-ink-3 text-sm">
          {String((error as Error)?.message ?? error)}
        </p>
        <Link to="/" className="mt-6 inline-block text-primary">Retour</Link>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData() as {
    client?: { name?: string; redirect_uri?: string };
    scope?: string;
    scopes?: string[];
  };
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "cette application";
  const redirectUri = details?.client?.redirect_uri;
  const scopes = details?.scopes ?? (details?.scope ? details.scope.split(/\s+/) : []);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const res = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (res.error) {
      setBusy(false);
      setError(res.error.message ?? "Échec");
      return;
    }
    const target = res.data?.redirect_url ?? res.data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Le serveur d'autorisation n'a pas renvoyé de redirection.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen bg-bg text-ink flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-lg border border-gold-border bg-surface p-8 shadow-notary">
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <span
            className="grid place-items-center w-10 h-10 rounded-md font-serif font-bold"
            style={{ background: "linear-gradient(160deg, #c9a45c, #a3823f)", color: "#1a1408" }}
          >
            M
          </span>
          <span className="font-serif font-semibold text-xl">
            mafiche<span className="text-primary">.be</span>
          </span>
        </div>

        <h1 className="font-serif text-xl font-semibold tracking-tight text-center">
          Connecter {clientName} à votre cabinet
        </h1>
        <p className="mt-3 text-sm text-ink-3 text-center">
          {clientName} pourra appeler les outils mafiche.be en votre nom. Vos
          règles d'accès (RLS) continuent de s'appliquer — seuls vos propres
          clients, dirigeants et fiches seront accessibles.
        </p>

        {redirectUri && (
          <p className="mt-4 text-xs text-ink-3 text-center break-all">
            Redirection : <span className="font-mono">{redirectUri}</span>
          </p>
        )}

        {scopes.length > 0 && (
          <ul className="mt-4 text-xs text-ink-3 space-y-1">
            {scopes.map((s) => (
              <li key={s} className="font-mono">• {s}</li>
            ))}
          </ul>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-400 text-center">{error}</p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(false)}
            className="px-4 py-2.5 rounded-md border border-gold-border-2 text-sm text-ink hover:bg-surface-2 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(true)}
            className="px-4 py-2.5 rounded-md font-bold text-sm transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: "linear-gradient(160deg, #c9a45c, #a3823f)", color: "#1a1408" }}
          >
            {busy ? "..." : "Autoriser"}
          </button>
        </div>

        <p className="mt-6 text-[10px] uppercase tracking-wider text-ink-3 text-center">
          Cette autorisation ne contourne pas les règles d'accès du cabinet.
        </p>
      </div>
    </main>
  );
}
