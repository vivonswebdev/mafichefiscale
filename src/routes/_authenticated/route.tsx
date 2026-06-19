import { createFileRoute, Outlet, redirect, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { WorkspaceSidebar } from "@/components/workspace-sidebar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

const titles: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/app": "Application",
  "/admin": "Administration",
};

const STORAGE_KEY = "mafiche.sidebar.open";

function AuthenticatedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title =
    Object.entries(titles).find(([k]) => pathname.startsWith(k))?.[1] ?? "Espace cabinet";

  // Persisted sidebar state (localStorage). Default open on desktop.
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === "1";
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
    } catch {
      /* quota / private mode */
    }
  }, [open]);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <div className="min-h-dvh flex w-full bg-bg text-ink">
        <WorkspaceSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header
            className="h-14 flex items-center gap-3 px-4 border-b border-gold-border sticky top-0 z-30 backdrop-blur-md"
            style={{ backgroundColor: "rgba(19,25,41,0.92)" }}
          >
            <SidebarTrigger
              aria-label={open ? "Réduire le menu latéral" : "Déplier le menu latéral"}
              className="text-ink-2 hover:text-ink"
            />
            <div className="h-5 w-px bg-gold-border" aria-hidden="true" />
            <Link
              to="/"
              className="text-xs font-mono uppercase tracking-wider text-ink-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm px-1"
            >
              ← Site public
            </Link>
            <div className="ml-auto font-serif text-sm text-ink-2" aria-live="polite">
              {title}
            </div>
          </header>
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
