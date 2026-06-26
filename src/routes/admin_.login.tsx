import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminLogin, adminMe } from "@/lib/admin.functions";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/admin_/login")({
  beforeLoad: async () => {
    const me = await adminMe();
    if (me.authenticated) {
      throw redirect({ to: me.mustChangePassword ? "/admin/account" : "/admin" });
    }
  },
  head: () => ({ meta: [{ title: "Admin sign in — Lakewood Hotel" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const login = useServerFn(adminLogin);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const res = await login({ data: { username, password } });
      if (!res.ok) { setError(res.error); setBusy(false); return; }
      window.location.href = res.mustChangePassword ? "/admin/account" : "/admin";
    } catch (e: any) {
      setError(e?.message || "Sign in failed");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary/40">
      <SiteHeader />
      <main className="flex-1 grid place-items-center px-4 py-16">
        <form onSubmit={onSubmit} className="surface-card w-full max-w-md p-8">
          <p className="field-label">Admin</p>
          <h1 className="font-display text-3xl">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Default credentials are <span className="font-mono">admin</span> /{" "}
            <span className="font-mono">ChangeMe!2026</span>. You'll be asked to update them on first login.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="field-label">Username</span>
              <input required value={username} onChange={(e) => setUsername(e.target.value)}
                autoComplete="username" className="field-input" />
            </label>
            <label className="block">
              <span className="field-label">Password</span>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" className="field-input" />
            </label>
          </div>

          {error && <div className="mt-4 text-sm text-destructive">{error}</div>}

          <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
    </div>
  );
}
