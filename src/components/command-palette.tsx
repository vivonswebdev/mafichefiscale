import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Home, AppWindow, Users, Tag, Info } from "lucide-react";

// La palette cherchait dans les clients, dirigeants, fiches et factures
// remontés vers Supabase — soit une petite partie de ce que contient
// l'application — et renvoyait vers des écrans qui n'existent plus.
// Chercher « Dupont » et ne pas le trouver alors qu'il est dans le dossier,
// c'est pire que ne pas chercher du tout. Elle se limite donc à la
// navigation ; la recherche métier se fait dans l'application, sur la
// totalité des données.
const DESTINATIONS = [
  { to: "/",         label: "Accueil",     icon: Home,      raccourci: "G A" },
  { to: "/app",      label: "Application", icon: AppWindow, raccourci: "G P" },
  { to: "/equipe",   label: "Équipe",      icon: Users },
  { to: "/pricing",  label: "Tarifs",      icon: Tag },
  { to: "/about",    label: "À propos",    icon: Info },
] as const;

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

  const go = (to: string) => {
    setOpen(false);
    navigate({ to: to as any });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Aller à…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {DESTINATIONS.map((d) => {
            const Icon = d.icon;
            return (
              <CommandItem key={d.to} onSelect={() => go(d.to)}>
                <Icon className="mr-2 h-4 w-4" /> {d.label}
                {"raccourci" in d && d.raccourci && <CommandShortcut>{d.raccourci}</CommandShortcut>}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
