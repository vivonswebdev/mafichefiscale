import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Building2,
  User,
  FileText,
  Receipt,
  LayoutDashboard,
  AppWindow,
  Plus,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const navigate = useNavigate();

  // Track auth state so the palette is only active for signed-in users.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setAuthed(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthed(!!session);
      if (!session) setOpen(false);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Cmd/Ctrl+K to toggle — only when authenticated.
  useEffect(() => {
    if (!authed) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authed]);

  const enabled = open && authed;

  const clientsQ = useQuery({
    queryKey: ["palette", "clients"],
    enabled,
    queryFn: async () =>
      (await supabase.from("clients").select("id,name,bce,email").order("name").limit(500)).data ?? [],
  });
  const dirsQ = useQuery({
    queryKey: ["palette", "dirigeants"],
    enabled,
    queryFn: async () =>
      (await supabase
        .from("dirigeants")
        .select("id,first_name,last_name,niss,client_id,clients(name)")
        .order("last_name")
        .limit(500)).data ?? [],
  });
  const fichesQ = useQuery({
    queryKey: ["palette", "fiches"],
    enabled,
    queryFn: async () =>
      (await supabase
        .from("fiches")
        .select("id,year,montant_brut,status,client_id,clients(name),dirigeants(first_name,last_name)")
        .order("created_at", { ascending: false })
        .limit(500)).data ?? [],
  });
  const invoicesQ = useQuery({
    queryKey: ["palette", "invoices"],
    enabled,
    queryFn: async () =>
      ((await (supabase.from("invoices") as any)
        .select("id,invoice_number,amount,status,due_date,client_id,clients(name)")
        .order("issue_date", { ascending: false })
        .limit(500)).data ?? []) as any[],
  });

  const go = (to: string, search?: Record<string, unknown>) => {
    setOpen(false);
    navigate({ to, search: search as any });
  };

  const fmtEur = (n: number) =>
    `€ ${Number(n || 0).toLocaleString("fr-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fichesData = useMemo(() => fichesQ.data ?? [], [fichesQ.data]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Rechercher un client, dirigeant, fiche, facture…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
            <CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/clients")}>
            <Building2 className="mr-2 h-4 w-4" /> Clients
          </CommandItem>
          <CommandItem onSelect={() => go("/invoices")}>
            <Receipt className="mr-2 h-4 w-4" /> Factures
          </CommandItem>
          <CommandItem onSelect={() => go("/app")}>
            <AppWindow className="mr-2 h-4 w-4" /> Application
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions rapides">
          <CommandItem onSelect={() => go("/clients")}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau client
          </CommandItem>
          <CommandItem onSelect={() => go("/invoices")}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle facture
          </CommandItem>
        </CommandGroup>

        {(clientsQ.data?.length ?? 0) > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Clients (${clientsQ.data!.length})`}>
              {clientsQ.data!.map((c: any) => (
                <CommandItem
                  key={`c-${c.id}`}
                  value={`client ${c.name} ${c.bce ?? ""} ${c.email ?? ""}`}
                  onSelect={() => go("/clients")}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground font-mono">{c.bce || c.email || ""}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {(dirsQ.data?.length ?? 0) > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Dirigeants (${dirsQ.data!.length})`}>
              {dirsQ.data!.map((d: any) => (
                <CommandItem
                  key={`d-${d.id}`}
                  value={`dirigeant ${d.first_name ?? ""} ${d.last_name ?? ""} ${d.niss ?? ""} ${d.clients?.name ?? ""}`}
                  onSelect={() => go("/clients")}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span className="flex-1 truncate">
                    {d.first_name} {d.last_name}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground truncate">
                    {d.clients?.name ?? ""}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {fichesData.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Fiches 281.20 (${fichesData.length})`}>
              {fichesData.map((f: any) => (
                <CommandItem
                  key={`f-${f.id}`}
                  value={`fiche ${f.year} ${f.clients?.name ?? ""} ${f.dirigeants?.first_name ?? ""} ${f.dirigeants?.last_name ?? ""} ${f.status ?? ""}`}
                  onSelect={() => go("/clients")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span className="flex-1 truncate">
                    {f.year} · {f.clients?.name ?? "—"} · {f.dirigeants?.first_name ?? ""} {f.dirigeants?.last_name ?? ""}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">{fmtEur(Number(f.montant_brut))}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {(invoicesQ.data?.length ?? 0) > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Factures (${invoicesQ.data!.length})`}>
              {invoicesQ.data!.map((inv: any) => (
                <CommandItem
                  key={`i-${inv.id}`}
                  value={`facture ${inv.invoice_number ?? ""} ${inv.clients?.name ?? ""} ${inv.status} ${inv.amount}`}
                  onSelect={() => go("/invoices", { client: inv.client_id })}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  <span className="flex-1 truncate">
                    {inv.invoice_number || "—"} · {inv.clients?.name ?? "—"}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {inv.status} · {fmtEur(Number(inv.amount))}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
