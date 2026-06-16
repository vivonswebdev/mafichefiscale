import { Link, useRouterState } from "@tanstack/react-router";
import { FileText } from "lucide-react";

const nav = [
  { to: "/", label: "Accueil" },
  { to: "/app", label: "Application" },
  { to: "/pricing", label: "Tarifs" },
  { to: "/about", label: "À propos" },
] as const;


export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="sticky top-0 z-50 bg-zinc-950/70 backdrop-blur-md border-b border-white/10">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] group-hover:shadow-[0_0_28px_rgba(6,182,212,0.6)] transition-shadow">
            <FileText className="w-4 h-4" strokeWidth={2.5} />
          </span>
          <span className="font-extrabold tracking-tight text-white text-lg">mafiche<span className="text-cyan-400">.be</span></span>
          <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">281.20</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "text-cyan-400 bg-cyan-400/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button className="hidden sm:inline-flex text-sm text-zinc-300 hover:text-white transition-colors">
            Se connecter
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-zinc-950 font-semibold text-sm hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.65)]">
            Essayer gratuitement
          </button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>© 2026 mafiche.be — Le logiciel des fiscalistes belges.</span>
        </div>
        <div className="flex gap-6">
          <a className="hover:text-white" href="#">Confidentialité</a>
          <a className="hover:text-white" href="#">Conditions</a>
          <a className="hover:text-white" href="#">Contact</a>
        </div>
      </div>
    </footer>
  );
}
