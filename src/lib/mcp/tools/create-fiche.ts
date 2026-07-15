import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sbForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_fiche",
  title: "Créer une fiche 281.20",
  description:
    "Génère automatiquement une nouvelle fiche fiscale 281.20 à partir d'un client (et optionnellement d'un dirigeant) pour le millésime indiqué. La fiche est créée en brouillon, sous l'identité de l'utilisateur connecté (RLS).",
  inputSchema: {
    client_id: z.string().uuid().describe("UUID du client concerné par la fiche."),
    year: z
      .number()
      .int()
      .min(2000)
      .max(2100)
      .describe("Millésime / année d'imposition de la fiche."),
    dirigeant_id: z
      .string()
      .uuid()
      .optional()
      .describe("UUID du dirigeant bénéficiaire (optionnel). Doit appartenir au même client."),
    montant_brut: z
      .number()
      .nonnegative()
      .optional()
      .describe("Montant brut attribué au dirigeant pour ce millésime (EUR)."),
    type: z
      .string()
      .default("281.20")
      .describe("Type de fiche fiscale (défaut 281.20)."),
    status: z
      .enum(["brouillon", "valide", "envoye", "cloture"])
      .default("brouillon")
      .describe("Statut initial de la fiche (défaut brouillon)."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ client_id, year, dirigeant_id, montant_brut, type, status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié" }], isError: true };
    }
    const sb = sbForUser(ctx);
    const userId = ctx.getUserId();

    // Verify the client belongs to the user (RLS also enforces this).
    const { data: client, error: clientErr } = await sb
      .from("clients")
      .select("id, name, legal_form, bce")
      .eq("id", client_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (clientErr) return { content: [{ type: "text", text: clientErr.message }], isError: true };
    if (!client) {
      return {
        content: [{ type: "text", text: "Client introuvable ou non accessible." }],
        isError: true,
      };
    }

    // If a dirigeant is provided, verify it belongs to that client.
    let dirigeantSnapshot: Record<string, unknown> | null = null;
    if (dirigeant_id) {
      const { data: dir, error: dirErr } = await sb
        .from("dirigeants")
        .select("id, first_name, last_name, fonction, niss, client_id")
        .eq("id", dirigeant_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (dirErr) return { content: [{ type: "text", text: dirErr.message }], isError: true };
      if (!dir || dir.client_id !== client_id) {
        return {
          content: [
            { type: "text", text: "Dirigeant introuvable ou non rattaché à ce client." },
          ],
          isError: true,
        };
      }
      dirigeantSnapshot = dir;
    }

    // Prevent trivial duplicates: same client+dirigeant+year already exists.
    const dupQuery = sb
      .from("fiches")
      .select("id")
      .eq("user_id", userId)
      .eq("client_id", client_id)
      .eq("year", year)
      .eq("type", type)
      .limit(1);
    const { data: existing } = dirigeant_id
      ? await dupQuery.eq("dirigeant_id", dirigeant_id)
      : await dupQuery.is("dirigeant_id", null);
    if (existing && existing.length > 0) {
      return {
        content: [
          {
            type: "text",
            text: `Une fiche ${type} existe déjà pour ce client${dirigeant_id ? " et ce dirigeant" : ""} en ${year} (id ${existing[0].id}).`,
          },
        ],
        isError: true,
      };
    }

    const { data, error } = await sb
      .from("fiches")
      .insert({
        user_id: userId,
        client_id,
        dirigeant_id: dirigeant_id ?? null,
        year,
        type,
        status,
        montant_brut: montant_brut ?? null,
        meta: {
          created_via: "mcp",
          client_snapshot: {
            name: client.name,
            legal_form: client.legal_form,
            bce: client.bce,
          },
          dirigeant_snapshot: dirigeantSnapshot,
        },
      })
      .select("id, client_id, dirigeant_id, year, type, status, montant_brut, created_at")
      .single();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [
        {
          type: "text",
          text: `Fiche ${type} créée pour ${client.name} — millésime ${year} (id ${data.id}).`,
        },
      ],
      structuredContent: { fiche: data },
    };
  },
});
