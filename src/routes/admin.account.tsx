import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminChangeCredentials } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/account")({
  component: AdminAccountPage,
});

function AdminAccountPage() {
  const navigate = useNavigate();
  const changeFn = useServerFn(adminChangeCredentials);
  const ctx = Route.useRouteContext() as { admin?: { username: string; mustChangePassword: boolean } };
  const mustChange = ctx.admin?.mustChangePassword;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState(ctx.admin?.username ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (newPassword !== confirm) { setErr("New passwords do not match"); return; }
    setBusy(true);
    try {
      const res = await changeFn({ data: { currentPassword, newUsername, newPassword } });
      if (!res.ok) { setErr(res.error); setBusy(false); return; }
      setMsg("Credentials updated.");
      setCurrentPassword(""); setNewPassword(""); setConfirm("");
      if (mustChange) navigate({ to: "/admin" });
    } catch (e: any) {
      setErr(e?.message || "Failed to update");
    } finally { setBusy(false); }
  }

  return (
    <div className="max-w-xl">
      <header className="mb-8">
        <p className="field-label">Admin account</p>
        <h1 className="font-display text-3xl">Username & password</h1>
        {mustChange && (
          <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
            You're using the default credentials. Please update them before continuing.
          </div>
        )}
      </header>

      <form onSubmit={onSubmit} className="surface-card p-6 md:p-8 space-y-4">
        <label className="block">
          <span className="field-label">Current password</span>
          <input required type="password" value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" className="field-input" />
        </label>
        <label className="block">
          <span className="field-label">New username</span>
          <input required minLength={3} maxLength={64} value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)} className="field-input" />
        </label>
        <label className="block">
          <span className="field-label">New password (min 8 chars)</span>
          <input required type="password" minLength={8} value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" className="field-input" />
        </label>
        <label className="block">
          <span className="field-label">Confirm new password</span>
          <input required type="password" minLength={8} value={confirm}
            onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className="field-input" />
        </label>
        {err && <div className="text-sm text-destructive">{err}</div>}
        {msg && <div className="text-sm text-success">{msg}</div>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Updating…" : "Update credentials"}
        </button>
      </form>
    </div>
  );
}
