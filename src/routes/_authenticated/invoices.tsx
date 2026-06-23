import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Receipt, Plus, CheckCircle2, Clock, AlertTriangle, Trash2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/invoices")({
  head: () => ({
    meta: [
      { title: "Factures clients — mafiche.be" },
      { name: "description", content: "Suivi des factures émises et des encours non payés par client." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    client: typeof search.client === "string" ? search.client : undefined,
    status: (["pending", "paid", "overdue", "cancelled", "all"] as const).includes(search.status as any)
      ? (search.status as "pending" | "paid" | "overdue" | "cancelled" | "all")
      : undefined,
  }),
  component: InvoicesPage,
});

type Invoice = {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string | null;
  amount: number;
  issue_date: string;
  due_date: string | null;
  paid_at: string | null;
  status: "pending" | "paid" | "cancelled";
  notes: string | null;
};

type ClientLite = { id: string; name: string; bce: string | null };

const todayIso = () => new Date().toISOString().slice(0, 10);
const fmtEur = (n: number) =>
  `€ ${Number(n || 0).toLocaleString("fr-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function isOverdue(inv: Invoice) {
  if (inv.status !== "pending" || !inv.due_date) return false;
  return inv.due_date < todayIso();
}

const emptyForm = {
  client_id: "",
  invoice_number: "",
  amount: "",
  issue_date: todayIso(),
  due_date: "",
  notes: "",
};

function InvoicesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid" | "overdue" | "cancelled">("all");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-lite"],
    queryFn: async (): Promise<ClientLite[]> => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, bce")
        .order("name");
      if (error) throw error;
      return (data ?? []) as ClientLite[];
    },
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async (): Promise<Invoice[]> => {
      const { data, error } = await (supabase.from("invoices") as any)
        .select("*")
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Invoice[];
    },
  });

  const clientById = useMemo(() => {
    const m = new Map<string, ClientLite>();
    clients.forEach((c) => m.set(c.id, c));
    return m;
  }, [clients]);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (filterClient !== "all" && inv.client_id !== filterClient) return false;
      if (filterStatus === "all") return true;
      if (filterStatus === "overdue") return isOverdue(inv);
      return inv.status === filterStatus;
    });
  }, [invoices, filterClient, filterStatus]);

  const stats = useMemo(() => {
    let pending = 0, paid = 0, overdue = 0, total = 0;
    for (const inv of invoices) {
      const amt = Number(inv.amount || 0);
      if (inv.status === "paid") paid += amt;
      else if (inv.status === "pending") {
        pending += amt;
        if (isOverdue(inv)) overdue += amt;
      }
      total += amt;
    }
    return { pending, paid, overdue, total, count: invoices.length };
  }, [invoices]);

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Non authentifié");
      if (!form.client_id) throw new Error("Sélectionnez un client");
      const amt = Number(form.amount);
      if (!isFinite(amt) || amt <= 0) throw new Error("Montant invalide");
      const payload = {
        user_id: u.user.id,
        client_id: form.client_id,
        invoice_number: form.invoice_number.trim() || null,
        amount: amt,
        issue_date: form.issue_date || todayIso(),
        due_date: form.due_date || null,
        notes: form.notes.trim() || null,
        status: "pending" as const,
      };
      const { error } = await (supabase.from("invoices") as any).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Invoice["status"] }) => {
      const patch: any = { status };
      patch.paid_at = status === "paid" ? todayIso() : null;
      const { error } = await (supabase.from("invoices") as any).update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("invoices") as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-ink-3 font-mono uppercase tracking-wider">Suivi des paiements</p>
            <h1 className="font-serif text-4xl font-semibold tracking-tight mt-2">
              Factures <span className="text-primary">clients</span>
            </h1>
            <p className="text-ink-2 mt-2">Émissions, encaissements et encours par client.</p>
          </div>
          <Link to="/dashboard" className="text-sm text-primary hover:text-primary-hover">← Retour au dashboard</Link>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total émis" value={fmtEur(stats.total)} sub={`${stats.count} facture(s)`} />
          <StatCard label="Encaissé" value={fmtEur(stats.paid)} sub="Payées" tone="green" icon={CheckCircle2} />
          <StatCard label="Encours" value={fmtEur(stats.pending)} sub="En attente" tone="amber" icon={Clock} />
          <StatCard label="En retard" value={fmtEur(stats.overdue)} sub="Action requise" tone="red" icon={AlertTriangle} />
        </div>

        {/* Form */}
        <div className="mt-8 rounded-lg border border-gold-border bg-surface p-6 shadow-notary">
          <h2 className="text-[13px] font-bold uppercase tracking-tight">Nouvelle facture</h2>
          <form
            className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3"
            onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
          >
            <select
              className="md:col-span-2 bg-surface-2 border border-gold-border rounded-md px-3 py-2 text-sm"
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              required
            >
              <option value="">— Sélectionner un client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.bce ? ` (${c.bce})` : ""}</option>
              ))}
            </select>
            <input
              className="bg-surface-2 border border-gold-border rounded-md px-3 py-2 text-sm"
              placeholder="N° facture"
              value={form.invoice_number}
              onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
            />
            <input
              type="number" step="0.01" min="0"
              className="bg-surface-2 border border-gold-border rounded-md px-3 py-2 text-sm"
              placeholder="Montant €"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <input
              type="date"
              className="bg-surface-2 border border-gold-border rounded-md px-3 py-2 text-sm"
              value={form.issue_date}
              onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
            />
            <input
              type="date"
              className="bg-surface-2 border border-gold-border rounded-md px-3 py-2 text-sm"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              placeholder="Échéance"
            />
            <input
              className="md:col-span-5 bg-surface-2 border border-gold-border rounded-md px-3 py-2 text-sm"
              placeholder="Notes (optionnel)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <button
              type="submit"
              disabled={create.isPending}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-bold text-sm disabled:opacity-50"
              style={{ background: "linear-gradient(160deg, #c9a45c, #a3823f)", color: "#1a1408" }}
            >
              <Plus className="w-4 h-4" /> {create.isPending ? "…" : "Ajouter"}
            </button>
            {create.error && (
              <p className="md:col-span-6 text-sm text-red-400">{(create.error as Error).message}</p>
            )}
          </form>
        </div>

        {/* Filters + table */}
        <div className="mt-8 rounded-lg border border-gold-border bg-surface overflow-hidden shadow-notary">
          <div className="px-6 py-4 border-b border-gold-border flex flex-wrap items-center gap-3 justify-between">
            <h2 className="text-[13px] font-bold uppercase tracking-tight flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" /> Historique
            </h2>
            <div className="flex gap-2">
              <select
                className="bg-surface-2 border border-gold-border rounded-md px-3 py-1.5 text-sm"
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
              >
                <option value="all">Tous clients</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select
                className="bg-surface-2 border border-gold-border rounded-md px-3 py-1.5 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="all">Tous statuts</option>
                <option value="pending">En attente</option>
                <option value="overdue">En retard</option>
                <option value="paid">Payées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-ink-3">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-ink-3">Aucune facture pour ce filtre.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: "#182032" }}>
                  <tr className="text-left text-[10px] font-mono uppercase tracking-[0.12em] text-ink-3 border-b border-gold-border">
                    <th className="px-6 py-3 font-medium">Client</th>
                    <th className="px-6 py-3 font-medium">N°</th>
                    <th className="px-6 py-3 font-medium">Émission</th>
                    <th className="px-6 py-3 font-medium">Échéance</th>
                    <th className="px-6 py-3 font-medium text-right">Montant</th>
                    <th className="px-6 py-3 font-medium">Statut</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => {
                    const client = clientById.get(inv.client_id);
                    const overdue = isOverdue(inv);
                    return (
                      <tr key={inv.id} className="border-b border-gold-border last:border-none hover:bg-surface-2">
                        <td className="px-6 py-3 font-medium">{client?.name ?? "—"}</td>
                        <td className="px-6 py-3 font-mono text-ink-2 text-xs">{inv.invoice_number ?? "—"}</td>
                        <td className="px-6 py-3 font-mono text-ink-2 text-xs">{inv.issue_date}</td>
                        <td className={`px-6 py-3 font-mono text-xs ${overdue ? "text-red-400" : "text-ink-2"}`}>
                          {inv.due_date ?? "—"}
                        </td>
                        <td className="px-6 py-3 text-right font-mono font-semibold">{fmtEur(inv.amount)}</td>
                        <td className="px-6 py-3">
                          <StatusBadge status={inv.status} overdue={overdue} />
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {inv.status !== "paid" && (
                              <button
                                onClick={() => setStatus.mutate({ id: inv.id, status: "paid" })}
                                className="px-2 py-1 rounded-sm border border-gold-border-2 text-xs hover:bg-surface-2"
                                title="Marquer payée"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              </button>
                            )}
                            {inv.status === "paid" && (
                              <button
                                onClick={() => setStatus.mutate({ id: inv.id, status: "pending" })}
                                className="px-2 py-1 rounded-sm border border-gold-border-2 text-xs hover:bg-surface-2"
                                title="Remettre en attente"
                              >
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                              </button>
                            )}
                            {inv.status !== "cancelled" && (
                              <button
                                onClick={() => setStatus.mutate({ id: inv.id, status: "cancelled" })}
                                className="px-2 py-1 rounded-sm border border-gold-border-2 text-xs hover:bg-surface-2"
                                title="Annuler"
                              >
                                <XCircle className="w-3.5 h-3.5 text-ink-3" />
                              </button>
                            )}
                            <button
                              onClick={() => { if (confirm("Supprimer cette facture ?")) del.mutate(inv.id); }}
                              className="px-2 py-1 rounded-sm border border-gold-border-2 text-xs hover:bg-surface-2"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function StatCard({
  label, value, sub, tone = "neutral", icon: Icon,
}: {
  label: string; value: string; sub?: string;
  tone?: "neutral" | "green" | "amber" | "red";
  icon?: typeof CheckCircle2;
}) {
  const colors = {
    neutral: { c: "#c9a45c", bg: "rgba(201,164,92,0.10)", b: "rgba(201,164,92,0.22)" },
    green:   { c: "#9ec5ad", bg: "rgba(107,156,124,0.12)", b: "rgba(107,156,124,0.28)" },
    amber:   { c: "#e4c382", bg: "rgba(214,162,74,0.12)",  b: "rgba(214,162,74,0.30)" },
    red:     { c: "#e88a8a", bg: "rgba(180,70,70,0.14)",   b: "rgba(180,70,70,0.32)" },
  }[tone];
  return (
    <div className="rounded-lg border border-gold-border bg-surface p-5 shadow-notary">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-ink-3">{label}</span>
        {Icon && (
          <span className="w-7 h-7 rounded-md grid place-items-center" style={{ color: colors.c, backgroundColor: colors.bg, border: `1px solid ${colors.b}` }}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <div className="mt-3 font-serif text-2xl font-semibold" style={{ color: colors.c }}>{value}</div>
      {sub && <div className="text-xs text-ink-3 mt-1">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status, overdue }: { status: Invoice["status"]; overdue: boolean }) {
  const map = {
    paid:      { label: "Payée",     c: "#9ec5ad", bg: "rgba(107,156,124,0.12)", b: "rgba(107,156,124,0.28)", Icon: CheckCircle2 },
    pending:   { label: overdue ? "En retard" : "En attente", c: overdue ? "#e88a8a" : "#e4c382", bg: overdue ? "rgba(180,70,70,0.14)" : "rgba(214,162,74,0.12)", b: overdue ? "rgba(180,70,70,0.32)" : "rgba(214,162,74,0.30)", Icon: overdue ? AlertTriangle : Clock },
    cancelled: { label: "Annulée",   c: "#9aa3b5", bg: "rgba(154,163,181,0.10)", b: "rgba(154,163,181,0.22)", Icon: XCircle },
  }[status];
  const Icon = map.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-sm border"
      style={{ color: map.c, backgroundColor: map.bg, borderColor: map.b }}
    >
      <Icon className="w-3 h-3" /> {map.label}
    </span>
  );
}
