import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  useEffect(() => {
    const syncDb = async (db: any) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (Array.isArray(db?.clients) && db.clients.length) {
          const rows = db.clients.map((c: any) => ({
            id: c.id,
            user_id: user.id,
            name: c.nom ?? c.name ?? "Sans nom",
            bce: c.bce ?? null,
            email: c.email ?? null,
            updated_at: new Date().toISOString(),
          }));
          await (supabase.from("clients") as any).upsert(rows, { onConflict: "id" });
          queryClient.invalidateQueries({ queryKey: ["clients"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        }
      } catch (err) {
        console.error("Sync error", err);
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key !== "btxpro_db" || !e.newValue) return;
      try { syncDb(JSON.parse(e.newValue)); } catch (err) { console.error("Sync parse", err); }
    };

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "DB_SYNC" && e.data.db) syncDb(e.data.db);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("message", onMessage);
    };
  }, [queryClient]);

  return (
    <iframe
      src="/app/index.html"
      title="mafiche.be application"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: 0,
        zIndex: 100,
        background: "#0c1019",
      }}
    />
  );
}
