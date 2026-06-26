import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  getAdminSettings, updateSettings, updatePaystackSecret, clearPaystackSecret,
} from "@/lib/settings.functions";

const settingsQuery = queryOptions({
  queryKey: ["admin-settings"],
  queryFn: () => getAdminSettings(),
});

export const Route = createFileRoute("/admin/settings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateSettings);
  const setSecretFn = useServerFn(updatePaystackSecret);
  const clearSecretFn = useServerFn(clearPaystackSecret);

  const { data } = useQuery(settingsQuery);
  const [form, setForm] = useState<any>(null);
  const [secret, setSecret] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (data && !form) setForm({ ...data }); }, [data, form]);

  const saveM = useMutation({
    mutationFn: (d: any) => updateFn({ data: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["public-settings"] });
      setMsg("Settings saved."); setErr(null);
    },
    onError: (e: any) => setErr(e?.message || "Failed to save"),
  });

  const secretM = useMutation({
    mutationFn: (s: string) => setSecretFn({ data: { secretKey: s } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      setSecret(""); setMsg("Paystack secret key saved."); setErr(null);
    },
    onError: (e: any) => setErr(e?.message || "Failed to save secret"),
  });

  const clearM = useMutation({
    mutationFn: () => clearSecretFn({}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      setMsg("Paystack secret key cleared.");
    },
  });

  if (!form) return <div className="surface-card p-10 text-center text-muted-foreground">Loading…</div>;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setErr(null);
    const { paystack_secret_configured, ...rest } = form;
    saveM.mutate({
      ...rest,
      deposit_percent: Number(rest.deposit_percent),
    });
  }

  return (
    <div className="max-w-3xl">
      <header className="mb-8">
        <p className="field-label">Configuration</p>
        <h1 className="font-display text-3xl">Hotel settings</h1>
      </header>

      <form onSubmit={onSubmit} className="surface-card p-6 md:p-8 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Hotel name">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field-input" />
          </Field>
          <Field label="Tagline">
            <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className="field-input" />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field-input" />
          </Field>
          <Field label="Email">
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field-input" />
          </Field>
          <Field label="Address" className="md:col-span-2">
            <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="field-input" />
          </Field>
          <Field label="About" className="md:col-span-2">
            <textarea rows={4} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} className="field-input" />
          </Field>
          <Field label="Hero image URL" className="md:col-span-2">
            <input value={form.hero_image_url} onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })} className="field-input" />
          </Field>
          <Field label="Currency code">
            <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="field-input" />
          </Field>
          <Field label="Currency symbol">
            <input value={form.currency_symbol} onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })} className="field-input" />
          </Field>
          <Field label="Deposit %">
            <input type="number" min={1} max={99} value={form.deposit_percent}
              onChange={(e) => setForm({ ...form, deposit_percent: Number(e.target.value) })} className="field-input" />
          </Field>
          <Field label="Paystack public key">
            <input value={form.paystack_public_key} onChange={(e) => setForm({ ...form, paystack_public_key: e.target.value })}
              placeholder="pk_..." className="field-input" />
          </Field>
        </div>

        {err && <div className="text-sm text-destructive">{err}</div>}
        {msg && <div className="text-sm text-success">{msg}</div>}
        <div className="flex justify-end">
          <button type="submit" disabled={saveM.isPending} className="btn-primary">
            {saveM.isPending ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>

      <section className="surface-card mt-8 p-6 md:p-8">
        <h2 className="font-display text-xl">Paystack secret key</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The secret key is write-only — once saved it can be replaced or cleared, but never read back.
        </p>
        <div className="mt-3 text-sm">
          Status:{" "}
          {form.paystack_secret_configured ? (
            <span className="text-success font-medium">Configured</span>
          ) : (
            <span className="text-muted-foreground">Not configured</span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)}
            placeholder="sk_..." className="field-input flex-1 min-w-[240px]" />
          <button onClick={() => secret && secretM.mutate(secret)}
            disabled={!secret || secretM.isPending} className="btn-primary">
            {secretM.isPending ? "Saving…" : "Save secret"}
          </button>
          {form.paystack_secret_configured && (
            <button onClick={() => { if (confirm("Clear the saved Paystack secret key?")) clearM.mutate(); }}
              className="btn-ghost text-destructive">
              Clear
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
