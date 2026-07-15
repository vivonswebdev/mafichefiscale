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
  name: "list_clients",
  title: "Lister les clients",
  description:
    "Retourne les clients du cabinet de l'utilisateur connecté (nom, BCE, email, forme juridique, ville).",
  inputSchema: {
    search: z
      .string()
      .optional()
      .describe("Filtre optionnel appliqué sur le nom, la BCE ou l'email du client."),
    limit: z.number().int().min(1).max(200).default(50).describe("Nombre max de clients à retourner."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié" }], isError: true };
    }
    const sb = sbForUser(ctx);
    let q = sb
      .from("clients")
      .select("id, name, bce, email, phone, city, legal_form, vat_subject")
      .eq("user_id", ctx.getUserId())
      .order("name", { ascending: true })
      .limit(limit);
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      q = q.or(`name.ilike.${s},bce.ilike.${s},email.ilike.${s}`);
    }
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { clients: data ?? [] },
    };
  },
});
