import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Building2, User, FileText, Trash2 } from "lucide-react";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/clients")({
  head: () => ({
    meta: [{ title: "Clients — mafiche.be" }],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"clients" | "dirigeants" | "fiches">("clients");

  const clients = useQuery({
    queryKey: ["clients"],
    queryFn: async () => (await supabase.from("clients").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const dirigeants = useQuery({
    queryKey: ["dirigeants"],
    queryFn: async () => (await supabase.from("dirigeants").select("*, clients(name)").order("created_at", { ascending: false })).data ?? [],
  });
  const fiches = useQuery({
    queryKey: ["fiches-list"],
    queryFn: async () => (await supabase.from("fiches").select("*, clients(name), dirigeants(first_name,last_name)").order("created_at", { ascending: false })).data ?? [],
  });

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">Gestion du cabinet</h1>
        <p className="text-ink-2 mt-2">Vos clients, dirigeants et fiches 281.20 — sauvegardés automatiquement.</p>

        <div className="mt-8 flex gap-1 border-b border-gold-border">
          {([
            { id: "clients", label: "Clients", icon: Building2 },
            { id: "dirigeants", label: "Dirigeants", icon: User },
            { id: "fiches", label: "Fiches 281.20", icon: FileText },
          ] as const).map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  active ? "text-primary border-primary" : "text-ink-3 border-transparent hover:text-ink"
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          {tab === "clients" && <ClientsTab data={clients.data ?? []} qc={qc} />}
          {tab === "dirigeants" && <DirigeantsTab data={dirigeants.data ?? []} clients={clients.data ?? []} qc={qc} />}
          {tab === "fiches" && <FichesTab data={fiches.data ?? []} clients={clients.data ?? []} dirigeants={dirigeants.data ?? []} qc={qc} />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-gold-border bg-surface p-6 shadow-notary">{children}</div>;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full px-3 py-2 rounded-md bg-surface-2 border border-gold-border text-ink focus:outline-none focus:border-primary ${props.className ?? ""}`} />;
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full px-3 py-2 rounded-md bg-surface-2 border border-gold-border text-ink focus:outline-none focus:border-primary ${props.className ?? ""}`} />;
}
function Btn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all hover:brightness-110 disabled:opacity-50 ${props.className ?? ""}`}
      style={{ background: "linear-gradient(160deg, #c9a45c, #a3823f)", color: "#1a1408", ...(props.style ?? {}) }}
    />
  );
}

const EMPTY_CLIENT = {
  name: "", bce: "", email: "", phone: "", gsm: "",
  address: "", postal_code: "", city: "",
  legal_form: "", capital: "" as string,
  vat_subject: true, vat_periodicity: "trimestrielle",
  fiscal_year_end: "31/12",
  csam_date: "", csam_duration_months: "" as string,
  monthly_fee: "" as string,
  notes: "",
};

function ClientsTab({ data, qc }: { data: any[]; qc: ReturnType<typeof useQueryClient> }) {
  const [form, setForm] = useState({ ...EMPTY_CLIENT });

  const invoicesQ = useQuery({
    queryKey: ["invoices", "pending-by-client"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("invoices") as any)
        .select("client_id,status,due_date")
        .eq("status", "pending");
      if (error) throw error;
      return (data ?? []) as { client_id: string; status: string; due_date: string | null }[];
    },
  });

  const badgeByClient = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const m = new Map<string, { count: number; overdue: boolean }>();
    for (const inv of invoicesQ.data ?? []) {
      const cur = m.get(inv.client_id) ?? { count: 0, overdue: false };
      cur.count += 1;
      if (inv.due_date && inv.due_date < today) cur.overdue = true;
      m.set(inv.client_id, cur);
    }
    return m;
  }, [invoicesQ.data]);

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const payload: Record<string, unknown> = {
        user_id: u.user!.id,
        name: form.name,
        bce: form.bce || null,
        email: form.email || null,
        phone: form.phone || null,
        gsm: form.gsm || null,
        address: form.address || null,
        postal_code: form.postal_code || null,
        city: form.city || null,
        legal_form: form.legal_form || null,
        capital: form.capital === "" ? null : Number(form.capital),
        vat_subject: form.vat_subject,
        vat_periodicity: form.vat_periodicity || null,
        fiscal_year_end: form.fiscal_year_end || null,
        csam_date: form.csam_date || null,
        csam_duration_months: form.csam_duration_months === "" ? null : Number(form.csam_duration_months),
        monthly_fee: form.monthly_fee === "" ? null : Number(form.monthly_fee),
        notes: form.notes || null,
      };
      const { data: row, error } = await supabase.from("clients").insert(payload as any).select().single();
      if (error) throw error;
      await logAudit("client.create", "client", row?.id, { name: form.name, bce: form.bce });
    },
    onSuccess: () => {
      toast.success("Client ajouté");
      setForm({ ...EMPTY_CLIENT });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
      await logAudit("client.delete", "client", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });

  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-6">
      <Card>
        <h2 className="text-[13px] font-bold uppercase tracking-tight">Vos clients ({data.length})</h2>
        <div className="mt-4 space-y-2">
          {data.length === 0 && <p className="text-ink-3 text-sm py-6 text-center">Aucun client. Ajoutez-en un →</p>}
          {data.map((c) => {
            const b = badgeByClient.get(c.id);
            return (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-md bg-surface-2 hover:bg-surface-3 transition-colors">
              <div>
                <div className="font-medium text-ink">{c.name} {c.legal_form && <span className="text-xs text-ink-3 font-normal">· {c.legal_form}</span>}</div>
                <div className="text-xs text-ink-3 font-mono">{c.bce || "Pas de BCE"} · {c.email || "—"} {c.monthly_fee ? `· € ${Number(c.monthly_fee).toFixed(2)}/mois` : ""}</div>
              </div>
              <div className="flex items-center gap-2">
                {b && b.count > 0 && (
                  <Link
                    to="/invoices"
                    search={{ client: c.id, status: b.overdue ? "overdue" : "pending" } as any}
                    title={b.overdue ? `${b.count} facture(s) en retard` : `${b.count} facture(s) en attente`}
                    className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-500 ${b.overdue ? "animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]" : ""}`}
                  >
                    {b.count}
                  </Link>
                )}
                <button onClick={() => del.mutate(c.id)} className="text-ink-3 hover:text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <h3 className="text-[13px] font-bold uppercase tracking-tight">Nouveau client</h3>
        <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <Input placeholder="Nom / dénomination *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="N° BCE (BE0...)" value={form.bce} onChange={(e) => setForm({ ...form, bce: e.target.value })} />
            <Select value={form.legal_form} onChange={(e) => setForm({ ...form, legal_form: e.target.value })}>
              <option value="">Forme juridique</option>
              <option value="SRL">SRL</option>
              <option value="SA">SA</option>
              <option value="SC">SC</option>
              <option value="SNC">SNC</option>
              <option value="SCS">SCS</option>
              <option value="Indép.">Indépendant</option>
              <option value="ASBL">ASBL</option>
            </Select>
          </div>
          <Input placeholder="Capital (€)" type="number" step="0.01" value={form.capital} onChange={(e) => setForm({ ...form, capital: e.target.value })} />
          <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="GSM" value={form.gsm} onChange={(e) => setForm({ ...form, gsm: e.target.value })} />
          </div>
          <Input placeholder="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-[110px_1fr] gap-2">
            <Input placeholder="CP" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
            <Input placeholder="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="rounded-md border border-gold-border bg-surface-2 p-3 space-y-2">
            <label className="flex items-center gap-2 text-sm text-ink-2">
              <input type="checkbox" checked={form.vat_subject} onChange={(e) => setForm({ ...form, vat_subject: e.target.checked })} />
              Assujetti TVA
            </label>
            <Select value={form.vat_periodicity} onChange={(e) => setForm({ ...form, vat_periodicity: e.target.value })} disabled={!form.vat_subject}>
              <option value="mensuelle">Déclaration mensuelle</option>
              <option value="trimestrielle">Déclaration trimestrielle</option>
            </Select>
            <Input placeholder="Clôture fiscale (ex: 31/12)" value={form.fiscal_year_end} onChange={(e) => setForm({ ...form, fiscal_year_end: e.target.value })} />
          </div>
          <div className="rounded-md border border-gold-border bg-surface-2 p-3 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-tight text-ink-3">Mandat CSAM</div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={form.csam_date} onChange={(e) => setForm({ ...form, csam_date: e.target.value })} />
              <Input type="number" placeholder="Durée (mois)" value={form.csam_duration_months} onChange={(e) => setForm({ ...form, csam_duration_months: e.target.value })} />
            </div>
          </div>
          <Input placeholder="Abonnement mensuel (€)" type="number" step="0.01" value={form.monthly_fee} onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })} />
          <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-md bg-surface-2 border border-gold-border text-ink focus:outline-none focus:border-primary text-sm" />
          <Btn type="submit" disabled={create.isPending} className="w-full justify-center"><Plus className="w-4 h-4" />Ajouter</Btn>
        </form>
      </Card>
    </div>
  );
}

function DirigeantsTab({ data, clients, qc }: { data: any[]; clients: any[]; qc: ReturnType<typeof useQueryClient> }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", niss: "", fonction: "", client_id: "" });
  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: row, error } = await supabase.from("dirigeants").insert({
        ...form, client_id: form.client_id || null, user_id: u.user!.id,
      }).select().single();
      if (error) throw error;
      await logAudit("dirigeant.create", "dirigeant", row?.id, { name: `${form.first_name} ${form.last_name}` });
    },
    onSuccess: () => {
      toast.success("Dirigeant ajouté");
      setForm({ first_name: "", last_name: "", niss: "", fonction: "", client_id: "" });
      qc.invalidateQueries({ queryKey: ["dirigeants"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("dirigeants").delete().eq("id", id); await logAudit("dirigeant.delete", "dirigeant", id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dirigeants"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <Card>
        <h2 className="text-[13px] font-bold uppercase tracking-tight">Dirigeants ({data.length})</h2>
        <div className="mt-4 space-y-2">
          {data.length === 0 && <p className="text-ink-3 text-sm py-6 text-center">Aucun dirigeant.</p>}
          {data.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-3 rounded-md bg-surface-2">
              <div>
                <div className="font-medium text-ink">{d.first_name} {d.last_name}</div>
                <div className="text-xs text-ink-3 font-mono">{d.niss || "—"} · {d.fonction || "—"} · {d.clients?.name || "—"}</div>
              </div>
              <button onClick={() => del.mutate(d.id)} className="text-ink-3 hover:text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="text-[13px] font-bold uppercase tracking-tight">Nouveau dirigeant</h3>
        <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <Input placeholder="Prénom" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <Input placeholder="Nom *" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
          <Input placeholder="NISS" value={form.niss} onChange={(e) => setForm({ ...form, niss: e.target.value })} />
          <Input placeholder="Fonction" value={form.fonction} onChange={(e) => setForm({ ...form, fonction: e.target.value })} />
          <Select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
            <option value="">— Client (optionnel) —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Btn type="submit" disabled={create.isPending} className="w-full justify-center"><Plus className="w-4 h-4" />Ajouter</Btn>
        </form>
      </Card>
    </div>
  );
}

function FichesTab({ data, clients, dirigeants, qc }: { data: any[]; clients: any[]; dirigeants: any[]; qc: ReturnType<typeof useQueryClient> }) {
  const [form, setForm] = useState({ client_id: "", dirigeant_id: "", year: new Date().getFullYear(), montant_brut: 0, status: "brouillon" });
  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: row, error } = await supabase.from("fiches").insert({
        client_id: form.client_id || null,
        dirigeant_id: form.dirigeant_id || null,
        year: Number(form.year),
        montant_brut: Number(form.montant_brut),
        status: form.status,
        user_id: u.user!.id,
      }).select().single();
      if (error) throw error;
      await logAudit("fiche.create", "fiche", row?.id, { year: form.year, montant_brut: form.montant_brut, status: form.status });
    },
    onSuccess: () => {
      toast.success("Fiche enregistrée");
      setForm({ client_id: "", dirigeant_id: "", year: new Date().getFullYear(), montant_brut: 0, status: "brouillon" });
      qc.invalidateQueries({ queryKey: ["fiches-list"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("fiches").delete().eq("id", id); await logAudit("fiche.delete", "fiche", id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fiches-list"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <Card>
        <h2 className="text-[13px] font-bold uppercase tracking-tight">Fiches 281.20 ({data.length})</h2>
        <div className="mt-4 space-y-2">
          {data.length === 0 && <p className="text-ink-3 text-sm py-6 text-center">Aucune fiche.</p>}
          {data.map((f: any) => (
            <div key={f.id} className="flex items-center justify-between p-3 rounded-md bg-surface-2">
              <div>
                <div className="font-medium text-ink">{f.clients?.name || "—"} · {f.dirigeants?.first_name} {f.dirigeants?.last_name}</div>
                <div className="text-xs text-ink-3 font-mono">{f.year} · € {Number(f.montant_brut).toLocaleString("fr-BE")} · {f.status}</div>
              </div>
              <button onClick={() => del.mutate(f.id)} className="text-ink-3 hover:text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="text-[13px] font-bold uppercase tracking-tight">Nouvelle fiche 281.20</h3>
        <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <Select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required>
            <option value="">— Client *</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={form.dirigeant_id} onChange={(e) => setForm({ ...form, dirigeant_id: e.target.value })} required>
            <option value="">— Dirigeant *</option>
            {dirigeants.map((d) => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
          </Select>
          <Input type="number" placeholder="Année" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} required />
          <Input type="number" step="0.01" placeholder="Rémunération brute" value={form.montant_brut} onChange={(e) => setForm({ ...form, montant_brut: Number(e.target.value) })} />
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="brouillon">Brouillon</option>
            <option value="en cours">En cours</option>
            <option value="à vérifier">À vérifier</option>
            <option value="validée">Validée</option>
          </Select>
          <Btn type="submit" disabled={create.isPending} className="w-full justify-center"><Plus className="w-4 h-4" />Enregistrer</Btn>
        </form>
      </Card>
    </div>
  );
}
