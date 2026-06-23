import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FileText, Users, Building2, Calculator, Plus, User,
  CheckCircle2, Clock, AlertCircle, TrendingUp, Trash2, RefreshCw,
} from "lucide-react";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Mon cabinet — mafiche.be" },
      { name: "description", content: "Votre cabinet en un coup d'œil : statistiques, clients, dirigeants et fiches 281.20 synchronisés." },
    ],
  }),
  component: AppPage,
});

const statutStyle: Record<string, { color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  validée:      { color: "#9ec5ad", bg: "rgba(107,156,124,0.12)", border: "rgba(107,156,124,0.28)", icon: CheckCircle2 },
  "en cours":   { color: "#9ed1c9", bg: "rgba(91,158,150,0.12)",  border: "rgba(91,158,150,0.28)", icon: Clock },
  "à vérifier": { color: "#e4c382", bg: "rgba(214,162,74,0.12)",  border: "rgba(214,162,74,0.30)", icon: AlertCircle },
  brouillon:    { color: "#c9c0a8", bg: "rgba(201,164,92,0.10)",  border: "rgba(201,164,92,0.22)", icon: Clock },
};

function AppPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"overview" | "clients" | "dirigeants" | "fiches">("overview");

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
    queryFn: async () =>
      (await supabase.from("fiches").select("*, clients(name), dirigeants(first_name,last_name,niss)").order("created_at", { ascending: false })).data ?? [],
  });
  const profile = useQuery({
    queryKey: ["profile-me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      return data;
    },
  });

  const fichesData = fiches.data ?? [];
  const totalBrut = fichesData.reduce((s, f: any) => s + Number(f.montant_brut || 0), 0);
  const greeting = profile.data?.full_name ? `Maître ${profile.data.full_name}` : "Bienvenue";

  const metrics = [
    { label: "Fiches 281.20", value: String(fichesData.length), icon: FileText },
    { label: "Clients actifs", value: String(clients.data?.length ?? 0), icon: Building2 },
    { label: "Dirigeants suivis", value: String(dirigeants.data?.length ?? 0), icon: Users },
    { label: "Masse salariale", value: `€ ${totalBrut.toLocaleString("fr-BE")}`, icon: Calculator },
  ];

  const tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: TrendingUp },
    { id: "clients", label: "Clients", icon: Building2 },
    { id: "dirigeants", label: "Dirigeants", icon: User },
    { id: "fiches", label: "Fiches 281.20", icon: FileText },
  ] as const;

  function syncAll() {
    qc.invalidateQueries();
    toast.success("Données synchronisées");
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-sm text-ink-3 font-mono uppercase tracking-wider">Bonjour, {greeting}</p>
            <h1 className="font-serif text-4xl font-semibold tracking-tight mt-2">
              Votre <span className="text-primary">cabinet</span> en un coup d'œil
            </h1>
            <p className="text-ink-2 mt-2">Exercice fiscal 2025 — données synchronisées en temps réel.</p>
          </div>
          <button
            onClick={syncAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gold-border-2 text-sm text-ink hover:bg-surface-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Synchroniser
          </button>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="rounded-lg border border-gold-border bg-surface p-[22px] shadow-notary">
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 rounded-md grid place-items-center text-primary"
                    style={{ backgroundColor: "rgba(201,164,92,0.10)", border: "1px solid rgba(201,164,92,0.22)" }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-sm font-mono uppercase tracking-wider"
                    style={{ color: "#9ec5ad", backgroundColor: "rgba(107,156,124,0.12)", border: "1px solid rgba(107,156,124,0.28)" }}
                  >
                    <TrendingUp className="w-3 h-3" /> Live
                  </span>
                </div>
                <div className="mt-5 font-serif text-3xl font-semibold tracking-tight text-ink">{m.value}</div>
                <div className="mt-1 text-sm text-ink-2">{m.label}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex gap-1 border-b border-gold-border overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  active ? "text-primary border-primary" : "text-ink-3 border-transparent hover:text-ink"
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8">
          {tab === "overview" && <OverviewTab fiches={fichesData} loading={fiches.isLoading} onJump={() => setTab("fiches")} />}
          {tab === "clients" && <ClientsTab data={clients.data ?? []} qc={qc} />}
          {tab === "dirigeants" && <DirigeantsTab data={dirigeants.data ?? []} clients={clients.data ?? []} qc={qc} />}
          {tab === "fiches" && <FichesTab data={fichesData} clients={clients.data ?? []} dirigeants={dirigeants.data ?? []} qc={qc} />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function OverviewTab({ fiches, loading, onJump }: { fiches: any[]; loading: boolean; onJump: () => void }) {
  return (
    <div className="rounded-lg border border-gold-border bg-surface overflow-hidden shadow-notary">
      <div className="px-6 py-5 flex items-center justify-between border-b border-gold-border">
        <div>
          <h2 className="text-[13px] font-bold tracking-tight text-ink uppercase">Fiches 281.20 récentes</h2>
          <p className="text-sm text-ink-3 mt-1">Vos dernières fiches enregistrées</p>
        </div>
        <button onClick={onJump} className="text-sm text-primary hover:text-primary-hover">Tout gérer →</button>
      </div>
      {loading ? (
        <div className="p-10 text-center text-ink-3">Chargement…</div>
      ) : fiches.length === 0 ? (
        <div className="p-12 text-center">
          <FileText className="w-10 h-10 text-ink-3 mx-auto mb-3" />
          <p className="text-ink-2">Aucune fiche pour l'instant.</p>
          <button
            onClick={onJump}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm"
            style={{ background: "linear-gradient(160deg, #c9a45c, #a3823f)", color: "#1a1408" }}
          >
            <Plus className="w-4 h-4" /> Créer une fiche
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "#182032" }}>
              <tr className="text-left text-[10px] font-mono uppercase tracking-[0.12em] text-ink-3 border-b border-gold-border">
                <th className="px-6 py-3 font-medium">Client</th>
                <th className="px-6 py-3 font-medium">Dirigeant</th>
                <th className="px-6 py-3 font-medium">NISS</th>
                <th className="px-6 py-3 font-medium">Année</th>
                <th className="px-6 py-3 font-medium text-right">Rém. brute</th>
                <th className="px-6 py-3 font-medium text-right">Statut</th>
              </tr>
            </thead>
            <tbody>
              {fiches.slice(0, 10).map((f: any) => {
                const s = statutStyle[f.status] ?? statutStyle.brouillon;
                const Icon = s.icon;
                const dirName = f.dirigeants
                  ? `${f.dirigeants.first_name ?? ""} ${f.dirigeants.last_name ?? ""}`.trim()
                  : "—";
                return (
                  <tr key={f.id} className="border-b border-gold-border last:border-none hover:bg-surface-2 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-8 h-8 rounded-sm grid place-items-center text-primary"
                          style={{ backgroundColor: "rgba(201,164,92,0.10)", border: "1px solid rgba(201,164,92,0.22)" }}
                        >
                          <Building2 className="w-4 h-4" />
                        </span>
                        <span className="font-medium text-ink">{f.clients?.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-ink-2">{dirName}</td>
                    <td className="px-6 py-4 text-ink-3 font-mono text-xs">{f.dirigeants?.niss ?? "—"}</td>
                    <td className="px-6 py-4 text-ink-2 font-mono">{f.year}</td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-ink">€ {Number(f.montant_brut).toLocaleString("fr-BE")}</td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-sm border"
                        style={{ color: s.color, backgroundColor: s.bg, borderColor: s.border }}
                      >
                        <Icon className="w-3 h-3" />
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
    },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
      await logAudit("client.delete", "client", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
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
    },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("dirigeants").delete().eq("id", id); await logAudit("dirigeant.delete", "dirigeant", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dirigeants"] }),
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
    },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("fiches").delete().eq("id", id); await logAudit("fiche.delete", "fiche", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fiches-list"] }),
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
