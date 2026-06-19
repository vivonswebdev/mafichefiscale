import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Building2, User, FileText, Trash2 } from "lucide-react";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/clients")({
  beforeLoad: () => {
    throw redirect({ to: "/app", replace: true });
  },
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
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">Gestion du cabinet</h1>
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

function ClientsTab({ data, qc }: { data: any[]; qc: ReturnType<typeof useQueryClient> }) {
  const [form, setForm] = useState({ name: "", bce: "", email: "", phone: "", address: "" });
  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: row, error } = await supabase.from("clients").insert({ ...form, user_id: u.user!.id }).select().single();
      if (error) throw error;
      await logAudit("client.create", "client", row?.id, { name: form.name, bce: form.bce });
    },
    onSuccess: () => {
      toast.success("Client ajouté");
      setForm({ name: "", bce: "", email: "", phone: "", address: "" });
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
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <Card>
        <h2 className="text-[13px] font-bold uppercase tracking-tight">Vos clients ({data.length})</h2>
        <div className="mt-4 space-y-2">
          {data.length === 0 && <p className="text-ink-3 text-sm py-6 text-center">Aucun client. Ajoutez-en un →</p>}
          {data.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-md bg-surface-2 hover:bg-surface-3 transition-colors">
              <div>
                <div className="font-medium text-ink">{c.name}</div>
                <div className="text-xs text-ink-3 font-mono">{c.bce || "Pas de BCE"} · {c.email || "—"}</div>
              </div>
              <button onClick={() => del.mutate(c.id)} className="text-ink-3 hover:text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="text-[13px] font-bold uppercase tracking-tight">Nouveau client</h3>
        <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <Input placeholder="Nom du client *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input placeholder="N° BCE (BE0...)" value={form.bce} onChange={(e) => setForm({ ...form, bce: e.target.value })} />
          <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input placeholder="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
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
