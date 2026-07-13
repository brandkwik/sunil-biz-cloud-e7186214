import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FileText, Users, Wallet, BarChart3, Plus, Bell, LogOut } from "lucide-react";
import { useStore, actions } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { toast } from "sonner";

const NAV = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/parties", label: "Parties", icon: Users },
  { to: "/expenses", label: "Expenses", icon: Wallet },
  { to: "/reports", label: "Reports", icon: BarChart3 },
] as const;

export function AppShell({ children, title, action }: { children: ReactNode; title: string; action?: ReactNode }) {
  const user = useStore((s) => s.user);
  const router = useRouter();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const onLogout = () => {
    actions.logout();
    toast.success("Signed out");
    router.navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile shell */}
      <div className="mx-auto max-w-md pb-24 md:hidden">
        <header className="brand-gradient sticky top-0 z-30 text-white">
          <div className="flex items-center justify-between px-4 pb-4 pt-5">
            <div className="min-w-0">
              <p className="text-xs/4 opacity-80">{user?.business ?? "SunilDemo"}</p>
              <h1 className="truncate font-display text-xl font-bold">{title}</h1>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {action}
              <button aria-label="Notifications" className="grid h-9 w-9 place-items-center rounded-full bg-white/15 backdrop-blur">
                <Bell className="h-4 w-4" />
              </button>
              <button aria-label="Sign out" onClick={onLogout} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 backdrop-blur">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
        <main className="px-4 pt-4">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
            {NAV.map((n) => {
              const active = pathname === n.to || pathname.startsWith(n.to + "/");
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition",
                    active ? "text-brand" : "text-muted-foreground",
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Desktop shell */}
      <div className="hidden md:flex md:min-h-screen">
        <aside className="w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground">
          <div className="flex items-center gap-2 px-5 py-5">
            <div className="grid h-9 w-9 place-items-center rounded-lg brand-gradient font-display font-bold text-white">S</div>
            <div className="min-w-0">
              <p className="font-display text-sm font-bold">SunilDemo</p>
              <p className="truncate text-xs text-sidebar-foreground/60">{user?.business}</p>
            </div>
          </div>
          <nav className="mt-4 space-y-1 px-3">
            {NAV.map((n) => {
              const active = pathname === n.to || pathname.startsWith(n.to + "/");
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    active ? "bg-brand text-brand-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-4 left-3 right-3">
            <Button variant="ghost" onClick={onLogout} className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </aside>
        <div className="flex-1">
          <header className="flex items-center justify-between border-b bg-card px-8 py-4">
            <div>
              <p className="text-xs text-muted-foreground">{user?.business}</p>
              <h1 className="font-display text-2xl font-bold">{title}</h1>
            </div>
            <div className="flex items-center gap-2">{action}</div>
          </header>
          <main className="mx-auto max-w-6xl px-8 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function FabAdd({ onClick, label = "Add" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full brand-gradient px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 md:hidden"
    >
      <Plus className="h-4 w-4" /> {label}
    </button>
  );
}
