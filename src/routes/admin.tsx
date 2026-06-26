import { createFileRoute, Outlet, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { adminMe, adminLogout } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const me = await adminMe();
    if (!me.authenticated) throw redirect({ to: "/admin/login" });
    if (me.mustChangePassword && location.pathname !== "/admin/account") {
      throw redirect({ to: "/admin/account" });
    }
    return { admin: me };
  },
  head: () => ({ meta: [{ title: "Admin — Lakewood Hotel" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const logout = useServerFn(adminLogout);
  const ctx = Route.useRouteContext() as { admin?: { username: string } };
  const username = ctx.admin?.username;

  async function onLogout() {
    await logout({});
    navigate({ to: "/admin/login" });
  }

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="container-page flex items-center justify-between py-4">
          <Link to="/admin" className="font-display text-xl">Lakewood · Admin</Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/admin" activeOptions={{ exact: true }}
              activeProps={{ className: "text-foreground font-medium" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}>
              Bookings
            </Link>
            <Link to="/admin/rooms"
              activeProps={{ className: "text-foreground font-medium" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}>
              Rooms
            </Link>
            <Link to="/admin/settings"
              activeProps={{ className: "text-foreground font-medium" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}>
              Settings
            </Link>
            <Link to="/admin/account"
              activeProps={{ className: "text-foreground font-medium" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}>
              Account
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            {username && <span className="text-muted-foreground hidden sm:inline">{username}</span>}
            <button onClick={onLogout} className="btn-ghost py-1.5 px-3 text-xs">Sign out</button>
          </div>
        </div>
      </header>
      <main className="container-page py-10">
        <Outlet />
      </main>
    </div>
  );
}
