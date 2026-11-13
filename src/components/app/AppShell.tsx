import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarDays, CheckSquare, ListChecks, Users, Plus, Settings } from "lucide-react";
import { meQuery, notificationsQuery } from "@/lib/ui";
import { Onboarding } from "./Onboarding";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/tasks", label: "My Tasks", icon: CheckSquare },
  { to: "/activities", label: "Activities", icon: ListChecks },
  { to: "/family", label: "Family", icon: Users },
] as const;

function Logo() {
  return (
    <Link to="/schedule" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground text-sm">R</span>
      RunTheWeek
    </Link>
  );
}

function BellLink() {
  const { data } = useQuery(notificationsQuery());
  const unread = (data ?? []).filter((n) => !n.read_at).length;
  return (
    <Link to="/notifications" aria-label="Notifications" className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-secondary">
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute right-1.5 top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-attention px-1 text-[11px] font-bold text-primary-foreground">{unread}</span>
      )}
    </Link>
  );
}

export function AppShell() {
  const me = useQuery(meQuery());
  const { pathname } = useLocation();
  if (me.isLoading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading your week…</div>;
  if (me.error) return <div className="grid min-h-screen place-items-center px-6 text-center text-muted-foreground">We couldn't load your family. Please refresh.</div>;
  if (!me.data) return <Onboarding />;

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 border-r bg-sidebar px-4 py-6 md:flex">
        <div className="mb-6 px-2"><Logo /></div>
        <Link to="/activities/new" className="mb-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground shadow-soft hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add activity
        </Link>
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className={cn("flex h-11 items-center gap-3 rounded-xl px-3 font-medium text-muted-foreground hover:bg-secondary", pathname.startsWith(n.to) && "bg-accent text-accent-foreground")}>
            <n.icon className="h-5 w-5" /> {n.label}
          </Link>
        ))}
        <Link to="/notifications" className={cn("flex h-11 items-center gap-3 rounded-xl px-3 font-medium text-muted-foreground hover:bg-secondary", pathname.startsWith("/notifications") && "bg-accent text-accent-foreground")}>
          <Bell className="h-5 w-5" /> Notifications
        </Link>
        <div className="mt-auto">
          <Link to="/settings" className="flex h-11 items-center gap-3 rounded-xl px-3 font-medium text-muted-foreground hover:bg-secondary">
            <Settings className="h-5 w-5" /> Settings
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-4 py-2 backdrop-blur md:hidden">
          <Logo />
          <div className="flex items-center">
            <BellLink />
            <Link to="/settings" aria-label="Settings" className="grid h-11 w-11 place-items-center rounded-full hover:bg-secondary"><Settings className="h-5 w-5" /></Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-32 pt-6 md:px-10 md:pb-16 md:pt-10">
          <Outlet />
        </main>
        <Link to="/activities/new" aria-label="Add activity" className="fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft md:hidden">
          <Plus className="h-6 w-6" />
        </Link>
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold text-muted-foreground", pathname.startsWith(n.to) && "text-primary")}>
              <n.icon className="h-5 w-5" /> {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
