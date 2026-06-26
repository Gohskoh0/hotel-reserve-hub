import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listAdminBookings, updateBookingStatus } from "@/lib/bookings.functions";
import { getAdminSettings } from "@/lib/settings.functions";

const settingsQuery = queryOptions({
  queryKey: ["admin-settings"],
  queryFn: () => getAdminSettings(),
});

export const Route = createFileRoute("/admin/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(settingsQuery);
  },
  component: AdminBookingsPage,
});

const STATUSES = ["all", "pending", "confirmed", "completed", "cancelled"] as const;

function AdminBookingsPage() {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateBookingStatus);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");

  const { data: settings } = useQuery(settingsQuery);
  const sym = settings?.currency_symbol ?? "₦";

  const bookingsQ = useQuery({
    queryKey: ["admin-bookings", status],
    queryFn: () => listAdminBookings({ data: { status } }),
  });

  const updateM = useMutation({
    mutationFn: (vars: { id: string; status: "pending" | "confirmed" | "cancelled" | "completed" }) =>
      updateFn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-bookings"] }),
  });

  return (
    <div>
      <header className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="field-label">Reservations</p>
          <h1 className="font-display text-3xl">Bookings</h1>
        </div>
        <div className="flex gap-1 rounded-full border border-border bg-background p-1 text-xs">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`capitalize rounded-full px-3 py-1.5 transition ${
                status === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </header>

      <div className="surface-card overflow-hidden">
        {bookingsQ.isLoading ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : (bookingsQ.data?.length ?? 0) === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No bookings yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Guest</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Rooms</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookingsQ.data!.map((b: any) => (
                  <tr key={b.id} className="border-t border-border align-top">
                    <td className="px-4 py-3 font-mono text-xs">{b.reference}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{b.guest_name}</div>
                      <div className="text-xs text-muted-foreground">{b.guest_email}</div>
                      <div className="text-xs text-muted-foreground">{b.guest_phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{b.check_in} → {b.check_out}</div>
                      <div className="text-xs text-muted-foreground">{b.nights} night(s) · {b.num_guests} guests</div>
                    </td>
                    <td className="px-4 py-3">{b.num_rooms}</td>
                    <td className="px-4 py-3">
                      <div>{sym}{Number(b.total_amount).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">paid {sym}{Number(b.amount_paid).toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{b.payment_status?.replace("_", " ")}</td>
                    <td className="px-4 py-3">
                      <select
                        value={b.status}
                        disabled={updateM.isPending}
                        onChange={(e) =>
                          updateM.mutate({ id: b.id, status: e.target.value as any })
                        }
                        className="field-input py-1 text-xs"
                      >
                        {["pending", "confirmed", "completed", "cancelled"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
