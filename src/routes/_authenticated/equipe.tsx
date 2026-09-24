import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { UserPlus, Trash2, ShieldCheck, Mail, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({
    meta: [
      { title: "Équipe — mafiche.be" },
      { name: "description", content: "Collaborateurs du cabinet, rôles et invitations." },
    ],
  }),
  component: EquipePage,
});

// Les mêmes rôles que dans l'application, avec les mêmes mots.
// Deux vocabulaires pour une même notion, c'est deux fois l'occasion de se tromper.
const ROLES = [
  { id: "owner",  label: "Administrateur", desc: "Accès complet, invite et retire les collaborateurs." },
  { id: "member", label: "Collaborateur",  desc: "Accès aux dossiers du cabinet, sans la gestion de l'équipe." },
] as const;

type Membre = {
  id: string; user_id: string; role: string; created_at: string;
  profiles?: { email?: string | null; full_name?: string | null } | null;
};
type Invitation = {
  id: string; email: string; role: string; created_at: string; accepted_at: string | null;
};

// La migration multi-tenant peut ne pas être appliquée. Plutôt que d'afficher
// une page cassée, on le détecte et on le dit.
const TABLE_ABSENTE = "42P01";

function EquipePage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("member");

  const cabinet = useQuery({
    queryKey: ["cabinet-courant"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("cabinet_members")
        .select("cabinet_id, role, cabinets(nom)")
        .eq("user_id", user?.id)
        .maybeSingle();
      if (error) return { erreur: error.code === TABLE_ABSENTE ? "migration" : error.message };
      return { cabinetId: data?.cabinet_id as string | undefined, monRole: data?.role as string | undefined, nom: data?.cabinets?.nom as string | undefined };
    },
    enabled: !!user?.id,
  });

  const cabinetId = (cabinet.data as any)?.cabinetId as string | undefined;
  const migrationManquante = (cabinet.data as any)?.erreur === "migration";
  const jeSuisOwner = (cabinet.data as any)?.monRole === "owner";

  const membres = useQuery({
    queryKey: ["cabinet-membres", cabinetId],
    queryFn: async () =>
      ((await (supabase as any).from("cabinet_members")
        .select("id, user_id, role, created_at, profiles(email, full_name)")
        .eq("cabinet_id", cabinetId)
        .order("created_at")).data ?? []) as Membre[],
    enabled: !!cabinetId,
  });

  const invitations = useQuery({
    queryKey: ["cabinet-invitations", cabinetId],
    queryFn: async () =>
      ((await (supabase as any).from("cabinet_invitations")
        .select("id, email, role, created_at, accepted_at")
        .eq("cabinet_id", cabinetId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false })).data ?? []) as Invitation[],
    enabled: !!cabinetId,
  });

  const inviter = useMutation({
    mutationFn: async () => {
      const adresse = email.trim().toLowerCase();
      if (!adresse || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adresse)) throw new Error("Adresse e-mail invalide");
      const { error } = await (supabase as any).from("cabinet_invitations")
        .insert({ cabinet_id: cabinetId, email: adresse, role, invited_by: user?.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setEmail("");
      qc.invalidateQueries({ queryKey: ["cabinet-invitations", cabinetId] });
      toast.success("Invitation enregistrée — elle prendra effet à l'inscription de cette adresse.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const annulerInvitation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("cabinet_invitations").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cabinet-invitations", cabinetId] }); toast.success("Invitation annulée"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const changerRole = useMutation({
    mutationFn: async ({ id, nouveau }: { id: string; nouveau: string }) => {
      const { error } = await (supabase as any).from("cabinet_members").update({ role: nouveau }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cabinet-membres", cabinetId] }); toast.success("Rôle modifié"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const retirer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("cabinet_members").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cabinet-membres", cabinetId] }); toast.success("Collaborateur retiré"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">
          {(cabinet.data as any)?.nom || "Votre cabinet"}
        </h1>
        <p className="text-ink-2 mt-2">
          Qui travaille dans ce cabinet, et ce que chacun peut faire. C'est la seule chose que
          l'application ne peut pas gérer elle-même : elle tourne dans votre navigateur, elle ne
          sait pas qui se connecte.
        </p>

        {migrationManquante && (
          <div
            className="mt-8 rounded-lg border p-5 text-sm"
            style={{ backgroundColor: "rgba(214,142,131,0.08)", borderColor: "rgba(214,142,131,0.35)" }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink">La base n'est pas encore prête pour le travail à plusieurs.</strong>
                <p className="text-ink-2 mt-1.5">
                  Les tables <code>cabinets</code> et <code>cabinet_members</code> n'existent pas :
                  les deux migrations <code>20260924140000_cabinets_multi_tenant.sql</code> et{" "}
                  <code>20260924180000_cabinet_invitations.sql</code> n'ont pas été appliquées.
                  Tant que c'est le cas, chaque compte ne voit que ses propres dossiers.
                </p>
                <p className="text-ink-3 mt-1.5">
                  Elles touchent la sécurité au niveau des lignes sur des données de production :
                  à relire, puis à déclencher sur une base sauvegardée.
                </p>
              </div>
            </div>
          </div>
        )}

        {!migrationManquante && (
          <>
            <section className="mt-10">
              <h2 className="font-serif text-2xl font-semibold tracking-tight">Collaborateurs</h2>
              <div className="mt-4 rounded-lg border border-gold-border bg-surface shadow-notary divide-y divide-gold-border">
                {membres.isLoading && <div className="p-5 text-sm text-ink-3">Chargement…</div>}
                {membres.data?.length === 0 && <div className="p-5 text-sm text-ink-3">Aucun collaborateur.</div>}
                {membres.data?.map((m) => {
                  const nom = m.profiles?.full_name || m.profiles?.email || "Compte sans profil";
                  const moi = m.user_id === user?.id;
                  return (
                    <div key={m.id} className="p-4 flex flex-wrap items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full grid place-items-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: "rgba(201,164,92,0.15)", color: "#c9a45c" }}
                      >
                        {nom.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-[160px]">
                        <div className="text-sm font-semibold">
                          {nom} {moi && <span className="text-[10px] font-mono uppercase text-primary">— vous</span>}
                        </div>
                        <div className="text-xs text-ink-3">{m.profiles?.email}</div>
                      </div>
                      {jeSuisOwner && !moi ? (
                        <select
                          value={m.role}
                          onChange={(e) => changerRole.mutate({ id: m.id, nouveau: e.target.value })}
                          className="rounded-md border border-gold-border bg-surface-2 px-2.5 py-1.5 text-sm text-ink"
                        >
                          {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-ink-3">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {ROLES.find((r) => r.id === m.role)?.label ?? m.role}
                        </span>
                      )}
                      {jeSuisOwner && !moi && (
                        <button
                          onClick={() => { if (confirm(`Retirer ${nom} du cabinet ?\n\nCette personne perdra l'accès à tous les dossiers.`)) retirer.mutate(m.id); }}
                          className="p-2 rounded-md text-ink-3 hover:text-primary transition-colors"
                          title="Retirer du cabinet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {jeSuisOwner && (
              <section className="mt-10">
                <h2 className="font-serif text-2xl font-semibold tracking-tight">Inviter</h2>
                <p className="text-ink-2 mt-2 text-sm">
                  On n'invite pas un compte, on invite une adresse : la personne rejoint
                  automatiquement le cabinet, avec le rôle choisi, dès qu'elle s'inscrit avec cette
                  adresse. Aucun mot de passe ne circule.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="collaborateur@cabinet.be"
                    className="flex-1 min-w-[220px] rounded-md border border-gold-border bg-surface px-3 py-2.5 text-sm text-ink"
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="rounded-md border border-gold-border bg-surface px-3 py-2.5 text-sm text-ink"
                  >
                    {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                  <button
                    onClick={() => inviter.mutate()}
                    disabled={inviter.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md font-bold text-sm transition-all hover:brightness-110 disabled:opacity-60"
                    style={{ background: "linear-gradient(160deg, #c9a45c, #a3823f)", color: "#1a1408" }}
                  >
                    <UserPlus className="w-4 h-4" /> Inviter
                  </button>
                </div>
                <p className="text-xs text-ink-3 mt-2">
                  {ROLES.find((r) => r.id === role)?.desc}
                </p>

                {!!invitations.data?.length && (
                  <div className="mt-6 rounded-lg border border-gold-border bg-surface shadow-notary divide-y divide-gold-border">
                    {invitations.data.map((i) => (
                      <div key={i.id} className="p-3.5 flex flex-wrap items-center gap-3">
                        <Mail className="w-4 h-4 text-ink-3 shrink-0" />
                        <span className="flex-1 min-w-[160px] text-sm">{i.email}</span>
                        <span className="text-xs font-mono uppercase tracking-wider text-ink-3">
                          {ROLES.find((r) => r.id === i.role)?.label ?? i.role} · en attente
                        </span>
                        <button
                          onClick={() => annulerInvitation.mutate(i.id)}
                          className="p-2 rounded-md text-ink-3 hover:text-primary transition-colors"
                          title="Annuler l'invitation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}

        <div
          className="mt-10 rounded-lg border p-4 text-sm text-ink-2"
          style={{ backgroundColor: "rgba(201,164,92,0.06)", borderColor: "rgba(201,164,92,0.28)" }}
        >
          Le travail quotidien — dossiers, tâches, temps, notes, comptabilité — se fait dans{" "}
          <Link to="/app" className="text-primary underline">l'application</Link>. Cette page ne
          gère que les accès.
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
