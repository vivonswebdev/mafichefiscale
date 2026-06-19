import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Application — mafiche.be" },
      { name: "description", content: "Application complète mafiche.be : dashboard, fiches 281.20, paie, attestations, échéances." },
    ],
  }),
  component: AppPage,
});

function AppPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string;
    const SUPA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

    const sendCreds = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const win = iframeRef.current?.contentWindow;
      if (!win || !session) return;
      win.postMessage(
        {
          type: "mafiche:supabase-creds",
          url: SUPA_URL,
          anonKey: SUPA_KEY,
          accessToken: session.access_token,
          userId: session.user.id,
        },
        window.location.origin,
      );
    };

    // Push creds when iframe asks
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "mafiche:ready") sendCreds();
    };
    window.addEventListener("message", onMessage);

    // Push on auth change (token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") sendCreds();
    });

    return () => {
      window.removeEventListener("message", onMessage);
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src="/app/index.html"
      title="mafiche.be application"
      className="w-full block"
      style={{
        height: "calc(100vh - 3.5rem)",
        border: 0,
        background: "#0c1019",
      }}
    />
  );
}
