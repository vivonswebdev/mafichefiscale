import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, AppWindow, Users, Shield, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";

const items = [
  { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard },
  { title: "Application", url: "/app", icon: AppWindow },
  { title: "Clients", url: "/clients", icon: Users },
] as const;

export function WorkspaceSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const isActive = (p: string) => pathname === p || pathname.startsWith(p + "/");

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/dashboard" className="flex items-center gap-2.5 px-2 py-3">
          <span
            className="grid place-items-center w-8 h-8 rounded-md font-serif font-bold shrink-0"
            style={{ background: "linear-gradient(160deg, #c9a45c, #a3823f)", color: "#1a1408" }}
          >
            M
          </span>
          {!collapsed && (
            <span className="font-serif font-semibold text-base text-ink truncate">
              mafiche<span className="text-primary">.be</span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Espace de travail</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin")} tooltip="Admin">
                    <Link to="/admin" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Admin &amp; audit</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-2 space-y-2">
          {!collapsed && user && (
            <div className="text-[11px] font-mono text-ink-3 truncate px-1">{user.email}</div>
          )}
          <button
            onClick={signOut}
            className="w-full inline-flex items-center gap-2 px-2 py-1.5 rounded-md border border-gold-border-2 text-sm text-ink hover:bg-surface-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
