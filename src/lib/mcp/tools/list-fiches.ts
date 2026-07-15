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
  name: "list_fiches",
  title: "Lister les fiches 281.20",
  description:
    "Retourne les fiches fiscales 281.20 de l'utilisateur connecté, optionnellement filtrées par année ou statut.",
  inputSchema: {
    year: z.number().int().min(2000).max(2100).optional().describe("Année d'imposition à filtrer."),
    status: z
      .enum(["brouillon", "valide", "envoye", "cloture"])
      .optional()
      .describe("Statut de la fiche."),
    limit: z.number().int().min(1).max(500).default(100),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ year, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié" }], isError: true };
    }
    const sb = sbForUser(ctx);
    let q = sb
      .from("fiches")
      .select("id, client_id, year, montant_brut, status, updated_at")
      .eq("user_id", ctx.getUserId())
      .order("year", { ascending: false })
      .limit(limit);
    if (year) q = q.eq("year", year);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { fiches: data ?? [] },
    };
  },
});
