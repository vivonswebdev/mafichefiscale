import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Shield, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

// Tableau de bord, Factures et Clients ont été retirés : ils réaffichaient,
// en plus pauvre, ce que l'application fait déjà sur l'ensemble des données.
// La coquille garde ce qu'elle seule peut faire — la vitrine et les accès.
const nav = [
  { to: "/", label: "Accueil" },
  { to: "/app", label: "Application" },
  { to: "/equipe", label: "Équipe" },
  { to: "/pricing", label: "Tarifs" },
  { to: "/about", label: "À propos" },
] as const;


export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  // Close mobile menu on route change.
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { next: "/app" }, replace: true });
  }

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{
        backgroundColor: "rgba(19,25,41,0.92)",
        boxShadow: "0 1px 0 rgba(201,164,92,0.25)",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span
            className="grid place-items-center w-9 h-9 rounded-md font-serif font-bold text-base"
            style={{
              background: "linear-gradient(160deg, #c9a45c, #a3823f)",
              color: "#1a1408",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }}
          >
            M
          </span>
          <span className="font-serif font-semibold tracking-tight text-ink text-lg">
            mafiche<span className="text-primary">.be</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active ? "text-primary-hover" : "text-ink-2 hover:text-ink hover:bg-surface-2"
                }`}
                style={active ? { backgroundColor: "rgba(201,164,92,0.14)" } : undefined}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-primary border border-gold-border-2 hover:bg-surface-2 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" /> Admin
                </Link>
              )}
              <span className="hidden lg:inline text-sm text-ink-2 font-mono">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-gold-border-2 text-sm text-ink hover:bg-surface-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" search={{ next: "/app" }} className="hidden sm:inline-flex text-sm text-ink-2 hover:text-ink transition-colors">
                Se connecter
              </Link>
              <Link
                to="/auth" search={{ next: "/app" }}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-md font-sans font-bold text-sm transition-all hover:brightness-110 hover:-translate-y-px"
                style={{
                  background: "linear-gradient(160deg, #c9a45c, #a3823f)",
                  color: "#1a1408",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }}
              >
                Essayer gratuitement
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-gold-border-2 text-ink hover:bg-surface-2 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{
            backgroundColor: "rgba(19,25,41,0.98)",
            borderColor: "rgba(201,164,92,0.25)",
          }}
        >
          <nav className="px-4 py-3 flex flex-col gap-1">
            {nav.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-3 py-2.5 rounded-md text-sm font-medium ${
                    active ? "text-primary-hover" : "text-ink-2 hover:text-ink hover:bg-surface-2"
                  }`}
                  style={active ? { backgroundColor: "rgba(201,164,92,0.14)" } : undefined}
                >
                  {n.label}
                </Link>
              );
            })}
            <div className="my-2 h-px bg-gold-border" />
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-primary hover:bg-surface-2"
                  >
                    <Shield className="w-4 h-4" /> Admin
                  </Link>
                )}
                <div className="px-3 py-2 text-xs font-mono text-ink-3 truncate">{user.email}</div>
                <button
                  onClick={signOut}
                  className="inline-flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-ink hover:bg-surface-2 text-left"
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth" search={{ next: "/app" }}
                  className="px-3 py-2.5 rounded-md text-sm text-ink-2 hover:text-ink hover:bg-surface-2"
                >
                  Se connecter
                </Link>
                <Link
                  to="/auth" search={{ next: "/app" }}
                  className="mt-1 inline-flex items-center justify-center px-4 py-2.5 rounded-md font-bold text-sm"
                  style={{
                    background: "linear-gradient(160deg, #c9a45c, #a3823f)",
                    color: "#1a1408",
                  }}
                >
                  Essayer gratuitement
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-gold-border">
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-ink-3">
        <div className="flex items-center gap-2 font-serif">
          <span
            className="grid place-items-center w-5 h-5 rounded-sm font-bold text-[10px]"
            style={{ background: "linear-gradient(160deg, #c9a45c, #a3823f)", color: "#1a1408" }}
          >
            M
          </span>
          <span>© 2026 mafiche.be — Cabinet de fiscalistes belges.</span>
        </div>
        <div className="flex gap-6">
          <Link to="/privacy" className="hover:text-ink">Confidentialité</Link>
          <Link to="/terms" className="hover:text-ink">Conditions</Link>
          <a className="hover:text-ink" href="mailto:contact@mafiche.be">Contact</a>
        </div>
      </div>
    </footer>
  );
}
