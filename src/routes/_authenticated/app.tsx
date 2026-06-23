import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Strip null/undefined/empty-string values so we never overwrite
    // existing Supabase data with blanks coming from the local app.
    const compact = <T extends Record<string, any>>(obj: T): Partial<T> => {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v === undefined || v === null) continue;
        if (typeof v === "string" && v.trim() === "") continue;
        out[k] = v;
      }
      return out as Partial<T>;
    };

    const toDateOrNull = (s: any): string | null => {
      if (!s || typeof s !== "string") return null;
      // Accept ISO yyyy-mm-dd or fr dd/mm/yyyy
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (m) return `${m[3]}-${m[2]}-${m[1]}`;
      return null;
    };

    const mapClient = (c: any, userId: string) => {
      const nowIso = new Date().toISOString();
      const address = [c.adresse].filter(Boolean).join(" ").trim();
      return compact({
        user_id: userId,
        local_id: String(c.id ?? ""),
        name: (c.nom ?? c.name ?? "").trim() || "Sans nom",
        bce: c.bce ?? null,
        email: c.email ?? null,
        phone: c.tel ?? c.phone ?? null,
        gsm: c.gsm ?? null,
        address: address || null,
        postal_code: c.cp ?? null,
        city: c.commune ?? c.ville ?? null,
        legal_form: c.forme ?? null,
        capital: typeof c.capital === "number" && c.capital > 0 ? c.capital : null,
        vat_subject: c.tva === "oui" ? true : c.tva === "non" ? false : null,
        vat_periodicity: c.tvaPeriode ?? null,
        fiscal_year_end: c.cloture ?? null,
        csam_date: toDateOrNull(c.mandatDate),
        csam_duration_months:
          typeof c.mandatDureeMois === "number" && c.mandatDureeMois > 0 ? c.mandatDureeMois : null,
        monthly_fee:
          typeof c.abonnement === "number" && c.abonnement > 0 ? c.abonnement : null,
        notes: c.note ?? c.notes ?? null,
        meta: {
          actionnaires: Array.isArray(c.actionnaires) ? c.actionnaires : [],
        },
        updated_at: nowIso,
      });
    };

    const syncDb = async (db: any) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        if (!Array.isArray(db?.clients) || !db.clients.length) return;

        const incoming = db.clients
          .map((c: any) => mapClient(c, user.id))
          .filter((r: any) => r.local_id);

        // Load existing rows for this user to merge by local_id without
        // erasing fields that aren't present in the incoming payload.
        const { data: existing, error: selErr } = await (supabase.from("clients") as any)
          .select("*")
          .eq("user_id", user.id);
        if (selErr) throw selErr;

        const byLocal = new Map<string, any>();
        (existing ?? []).forEach((row: any) => {
          if (row.local_id) byLocal.set(String(row.local_id), row);
        });

        const toInsert: any[] = [];
        const toUpdate: any[] = [];
        for (const row of incoming) {
          const prev = byLocal.get(String(row.local_id));
          if (prev) {
            // Merge: keep previous values for missing keys.
            toUpdate.push({ id: prev.id, ...prev, ...row });
          } else {
            toInsert.push(row);
          }
        }

        if (toInsert.length) {
          const { error } = await (supabase.from("clients") as any).insert(toInsert);
          if (error) throw error;
        }
        for (const row of toUpdate) {
          const { id, ...patch } = row;
          const { error } = await (supabase.from("clients") as any)
            .update(patch)
            .eq("id", id);
          if (error) throw error;
        }

        queryClient.invalidateQueries({ queryKey: ["clients"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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
