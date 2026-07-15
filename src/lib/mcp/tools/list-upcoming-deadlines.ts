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

type Deadline = {
  client_id: string;
  client_name: string;
  category: "TVA" | "ISOC" | "CSAM" | "Fiche 281.20" | "Facture";
  label: string;
  due_date: string; // ISO yyyy-mm-dd
  status: string;
  reference_id?: string;
};

function addMonths(d: Date, months: number): Date {
  const r = new Date(d.getTime());
  r.setUTCMonth(r.getUTCMonth() + months);
  return r;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function statusFor(dueISO: string, todayISO: string): string {
  if (dueISO < todayISO) return "en_retard";
  const due = new Date(dueISO + "T00:00:00Z").getTime();
  const today = new Date(todayISO + "T00:00:00Z").getTime();
  const days = Math.round((due - today) / 86_400_000);
  if (days <= 15) return "urgent";
  if (days <= 45) return "a_venir";
  return "planifie";
}

/**
 * Compute the next VAT declaration deadline after `from`.
 * Belgian VAT: monthly filers → 20th of next month; quarterly → 20th of month after quarter end.
 */
function nextVatDeadline(from: Date, periodicity: string | null): Date | null {
  if (!periodicity) return null;
  const p = periodicity.toLowerCase();
  if (p.startsWith("mens") || p === "monthly") {
    // Next 20th (of a following month) after `from`.
    const y = from.getUTCFullYear();
    const m = from.getUTCMonth();
    let candidate = new Date(Date.UTC(y, m, 20));
    if (candidate <= from) candidate = new Date(Date.UTC(y, m + 1, 20));
    return candidate;
  }
  if (p.startsWith("trim") || p === "quarterly") {
    // Quarter ends: Mar, Jun, Sep, Dec — deadline 20th of the following month.
    const y = from.getUTCFullYear();
    const quarterEnds = [2, 5, 8, 11]; // month indices of Mar/Jun/Sep/Dec
    for (const qe of quarterEnds) {
      const dl = new Date(Date.UTC(y, qe + 1, 20));
      if (dl > from) return dl;
    }
    return new Date(Date.UTC(y + 1, 3, 20)); // April 20 next year
  }
  return null;
}

export default defineTool({
  name: "list_upcoming_deadlines",
  title: "Lister les échéances fiscales à venir",
  description:
    "Retourne les échéances fiscales à venir pour les clients du cabinet connecté : TVA (mensuelle/trimestrielle), impôt des sociétés (7 mois après clôture), renouvellement CSAM, fiches 281.20 du millésime en cours, et factures non payées. Chaque échéance inclut le client, la catégorie, la date clé et un statut (en_retard, urgent, a_venir, planifie).",
  inputSchema: {
    client_id: z
      .string()
      .uuid()
      .optional()
      .describe("Restreindre les échéances à un dossier client précis."),
    horizon_days: z
      .number()
      .int()
      .min(7)
      .max(730)
      .default(180)
      .describe("Fenêtre en jours à partir d'aujourd'hui (défaut 180)."),
    include_overdue: z
      .boolean()
      .default(true)
      .describe("Inclure les échéances déjà dépassées mais non clôturées."),
    limit: z.number().int().min(1).max(500).default(200),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ client_id, horizon_days, include_overdue, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié" }], isError: true };
    }
    const sb = sbForUser(ctx);
    const userId = ctx.getUserId();

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayISO = iso(today);
    const horizonEnd = new Date(today.getTime() + horizon_days * 86_400_000);
    const horizonISO = iso(horizonEnd);

    // Load clients (scope respected by RLS).
    let clientsQ = sb
      .from("clients")
      .select(
        "id, name, fiscal_year_end, vat_subject, vat_periodicity, csam_date, csam_duration_months",
      )
      .eq("user_id", userId);
    if (client_id) clientsQ = clientsQ.eq("id", client_id);
    const { data: clients, error: cErr } = await clientsQ;
    if (cErr) return { content: [{ type: "text", text: cErr.message }], isError: true };

    const deadlines: Deadline[] = [];
    const clientById = new Map<string, { name: string }>();

    for (const c of clients ?? []) {
      clientById.set(c.id, { name: c.name });

      // --- TVA ---
      if (c.vat_subject && c.vat_periodicity) {
        const dl = nextVatDeadline(today, c.vat_periodicity);
        if (dl) {
          const dlISO = iso(dl);
          if (dlISO <= horizonISO) {
            deadlines.push({
              client_id: c.id,
              client_name: c.name,
              category: "TVA",
              label: `Déclaration TVA (${c.vat_periodicity})`,
              due_date: dlISO,
              status: statusFor(dlISO, todayISO),
            });
          }
        }
      }

      // --- ISOC: 7 months after fiscal year end ---
      if (c.fiscal_year_end) {
        // fiscal_year_end stored as MM-DD or full date; try to parse.
        const raw = String(c.fiscal_year_end);
        let month = -1;
        let day = -1;
        const full = raw.match(/^\d{4}-(\d{2})-(\d{2})$/);
        const md = raw.match(/^(\d{2})-(\d{2})$/);
        if (full) {
          month = parseInt(full[1], 10) - 1;
          day = parseInt(full[2], 10);
        } else if (md) {
          month = parseInt(md[1], 10) - 1;
          day = parseInt(md[2], 10);
        }
        if (month >= 0 && day > 0) {
          for (const yOffset of [-1, 0]) {
            const closing = new Date(Date.UTC(today.getUTCFullYear() + yOffset, month, day));
            const dl = addMonths(closing, 7);
            const dlISO = iso(dl);
            if (dlISO >= todayISO && dlISO <= horizonISO) {
              deadlines.push({
                client_id: c.id,
                client_name: c.name,
                category: "ISOC",
                label: `Déclaration ISOC (clôture ${iso(closing)})`,
                due_date: dlISO,
                status: statusFor(dlISO, todayISO),
              });
              break;
            }
          }
        }
      }

      // --- CSAM renewal ---
      if (c.csam_date && c.csam_duration_months) {
        const start = new Date(c.csam_date + "T00:00:00Z");
        if (!isNaN(start.getTime())) {
          const dl = addMonths(start, Number(c.csam_duration_months));
          const dlISO = iso(dl);
          if (
            dlISO <= horizonISO &&
            (dlISO >= todayISO || include_overdue)
          ) {
            deadlines.push({
              client_id: c.id,
              client_name: c.name,
              category: "CSAM",
              label: "Renouvellement mandat CSAM",
              due_date: dlISO,
              status: statusFor(dlISO, todayISO),
            });
          }
        }
      }
    }

    // --- Fiches 281.20 en brouillon/valide pour le millésime précédent ---
    const currentYear = today.getUTCFullYear();
    const fichesYear = currentYear - 1; // fiche déposée l'année suivant l'exercice
    let fichesQ = sb
      .from("fiches")
      .select("id, client_id, year, status, updated_at")
      .eq("user_id", userId)
      .eq("year", fichesYear)
      .in("status", include_overdue ? ["brouillon", "valide"] : ["brouillon", "valide"]);
    if (client_id) fichesQ = fichesQ.eq("client_id", client_id);
    const { data: fiches, error: fErr } = await fichesQ;
    if (fErr) return { content: [{ type: "text", text: fErr.message }], isError: true };

    // Deadline légale fiches 281.20 : 30/06 de l'année suivante (approximation).
    const ficheDeadlineISO = `${currentYear}-06-30`;
    for (const f of fiches ?? []) {
      if (!clientById.has(f.client_id!)) continue;
      if (ficheDeadlineISO > horizonISO) continue;
      if (!include_overdue && ficheDeadlineISO < todayISO) continue;
      deadlines.push({
        client_id: f.client_id!,
        client_name: clientById.get(f.client_id!)!.name,
        category: "Fiche 281.20",
        label: `Fiche 281.20 — millésime ${f.year} (${f.status})`,
        due_date: ficheDeadlineISO,
        status: statusFor(ficheDeadlineISO, todayISO),
        reference_id: f.id,
      });
    }

    // --- Factures non payées avec échéance à venir ---
    let invQ = sb
      .from("invoices")
      .select("id, client_id, invoice_number, due_date, status, amount")
      .eq("user_id", userId)
      .not("status", "eq", "paid")
      .not("due_date", "is", null)
      .lte("due_date", horizonISO);
    if (!include_overdue) invQ = invQ.gte("due_date", todayISO);
    if (client_id) invQ = invQ.eq("client_id", client_id);
    const { data: invoices, error: iErr } = await invQ;
    if (iErr) return { content: [{ type: "text", text: iErr.message }], isError: true };

    for (const inv of invoices ?? []) {
      const name = clientById.get(inv.client_id!)?.name;
      if (!name || !inv.due_date) continue;
      deadlines.push({
        client_id: inv.client_id!,
        client_name: name,
        category: "Facture",
        label: `Facture ${inv.invoice_number ?? inv.id.slice(0, 8)} (${inv.amount} EUR)`,
        due_date: inv.due_date,
        status: statusFor(inv.due_date, todayISO),
        reference_id: inv.id,
      });
    }

    // Sort by due_date, cap by limit.
    deadlines.sort((a, b) => a.due_date.localeCompare(b.due_date));
    const capped = deadlines.slice(0, limit);

    const summary =
      capped.length === 0
        ? "Aucune échéance à venir dans la fenêtre demandée."
        : capped
            .map(
              (d) =>
                `• ${d.due_date} — ${d.client_name} — ${d.category} — ${d.label} [${d.status}]`,
            )
            .join("\n");

    return {
      content: [{ type: "text", text: summary }],
      structuredContent: {
        today: todayISO,
        horizon_end: horizonISO,
        count: capped.length,
        deadlines: capped,
      },
    };
  },
});
