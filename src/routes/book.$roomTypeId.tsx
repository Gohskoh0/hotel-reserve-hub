import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getPublicSettings } from "@/lib/settings.functions";
import { getRoomById } from "@/lib/rooms.functions";
import { checkAvailability, createBooking } from "@/lib/bookings.functions";
import { initPaystackForBooking } from "@/lib/paystack.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const settingsQuery = queryOptions({
  queryKey: ["public-settings"],
  queryFn: () => getPublicSettings(),
});

export const Route = createFileRoute("/book/$roomTypeId")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(settingsQuery);
    const room = await context.queryClient.ensureQueryData({
      queryKey: ["room", params.roomTypeId],
      queryFn: () => getRoomById({ data: { id: params.roomTypeId } }),
    });
    if (!room) throw notFound();
    return null;
  },
  head: () => ({ meta: [{ title: "Book your stay — Lakewood Hotel" }] }),
  component: BookingPage,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-8 text-center">
      <div>
        <h1 className="font-display text-3xl">Room not found</h1>
        <p className="mt-2 text-muted-foreground">That room is no longer available.</p>
      </div>
    </div>
  ),
});

function BookingPage() {
  const { roomTypeId } = Route.useParams();
  const navigate = useNavigate();
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const { data: room } = useSuspenseQuery({
    queryKey: ["room", roomTypeId],
    queryFn: () => getRoomById({ data: { id: roomTypeId } }),
    select: (r) => r!,
  });

  const checkFn = useServerFn(checkAvailability);
  const createFn = useServerFn(createBooking);
  const initPayFn = useServerFn(initPaystackForBooking);

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  const [form, setForm] = useState({
    checkIn: today,
    checkOut: tomorrow,
    numRooms: 1,
    numGuests: 1,
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    notes: "",
    paymentOption: "full" as "full" | "deposit" | "none",
  });
  const [avail, setAvail] = useState<{
    available: boolean; remaining?: number; nights?: number; total?: number; error?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!room) return null;

  const sym = settings.currency_symbol;

  const nights =
    Math.max(
      0,
      Math.round(
        (new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86_400_000,
      ),
    );
  const baseTotal = nights * Number(room.price_per_night) * form.numRooms;
  const depositAmount = Math.round(baseTotal * (settings.deposit_percent / 100) * 100) / 100;
  const dueNow =
    form.paymentOption === "full" ? baseTotal : form.paymentOption === "deposit" ? depositAmount : 0;

  async function onCheck() {
    setErr(null); setBusy(true);
    try {
      const res = await checkFn({
        data: {
          roomTypeId: room.id,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          numRooms: form.numRooms,
        },
      });
      setAvail(res);
    } catch (e: any) {
      setErr(e?.message || "Could not check availability");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const res = await createFn({
        data: {
          roomTypeId: room.id,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          numRooms: form.numRooms,
          numGuests: form.numGuests,
          guestName: form.guestName,
          guestEmail: form.guestEmail,
          guestPhone: form.guestPhone,
          notes: form.notes,
          paymentOption: form.paymentOption,
        },
      });
      if (form.paymentOption === "none") {
        navigate({ to: "/booking/$reference", params: { reference: res.reference } });
        return;
      }
      // Initialize Paystack
      const callbackUrl = `${window.location.origin}/payment/callback`;
      const pay = await initPayFn({
        data: { bookingReference: res.reference, callbackUrl },
      });
      if (!pay.ok) {
        // Booking created but payment failed to init — send to confirmation with notice
        setErr(pay.error);
        navigate({
          to: "/booking/$reference",
          params: { reference: res.reference },
          search: { paymentError: pay.error },
        });
        return;
      }
      window.location.href = pay.authorizationUrl;
    } catch (e: any) {
      setErr(e?.message || "Could not create booking");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader hotelName={settings.name} />
      <main className="flex-1 container-page py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr,1fr]">
          {/* Form */}
          <form onSubmit={onSubmit} className="surface-card p-6 md:p-10 space-y-8">
            <header>
              <p className="field-label">Reserve</p>
              <h1 className="font-display text-3xl md:text-4xl">{room.name}</h1>
              <p className="mt-2 text-muted-foreground">{room.description}</p>
            </header>

            <section className="grid grid-cols-2 gap-4">
              <Field label="Check-in">
                <input type="date" min={today} required value={form.checkIn}
                  onChange={(e) => { setForm({ ...form, checkIn: e.target.value }); setAvail(null); }}
                  className="field-input" />
              </Field>
              <Field label="Check-out">
                <input type="date" min={form.checkIn} required value={form.checkOut}
                  onChange={(e) => { setForm({ ...form, checkOut: e.target.value }); setAvail(null); }}
                  className="field-input" />
              </Field>
              <Field label="Rooms">
                <input type="number" min={1} max={room.total_inventory} required value={form.numRooms}
                  onChange={(e) => { setForm({ ...form, numRooms: Number(e.target.value) }); setAvail(null); }}
                  className="field-input" />
              </Field>
              <Field label="Guests">
                <input type="number" min={1} max={room.capacity * form.numRooms} required value={form.numGuests}
                  onChange={(e) => setForm({ ...form, numGuests: Number(e.target.value) })}
                  className="field-input" />
              </Field>
            </section>

            <div>
              <button type="button" onClick={onCheck} disabled={busy} className="btn-ghost text-sm">
                Check availability
              </button>
              {avail && (
                <div className={`mt-3 text-sm ${avail.available ? "text-success" : "text-destructive"}`}>
                  {avail.available
                    ? `Available — ${avail.remaining} room(s) left for these dates.`
                    : avail.error}
                </div>
              )}
            </div>

            <section>
              <h2 className="font-display text-xl mb-4">Your details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full name">
                  <input required value={form.guestName} maxLength={120}
                    onChange={(e) => setForm({ ...form, guestName: e.target.value })} className="field-input" />
                </Field>
                <Field label="Email">
                  <input required type="email" value={form.guestEmail} maxLength={200}
                    onChange={(e) => setForm({ ...form, guestEmail: e.target.value })} className="field-input" />
                </Field>
                <Field label="Phone">
                  <input required value={form.guestPhone} maxLength={40}
                    onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} className="field-input" />
                </Field>
                <Field label="Notes (optional)">
                  <input value={form.notes} maxLength={500}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })} className="field-input" />
                </Field>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl mb-4">Payment</h2>
              <div className="grid gap-3">
                <PayOption
                  selected={form.paymentOption === "full"}
                  onSelect={() => setForm({ ...form, paymentOption: "full" })}
                  title="Pay full amount now"
                  subtitle={`${sym}${baseTotal.toLocaleString()} via Paystack`} />
                <PayOption
                  selected={form.paymentOption === "deposit"}
                  onSelect={() => setForm({ ...form, paymentOption: "deposit" })}
                  title={`Pay ${settings.deposit_percent}% deposit now`}
                  subtitle={`${sym}${depositAmount.toLocaleString()} now, balance on arrival`} />
                <PayOption
                  selected={form.paymentOption === "none"}
                  onSelect={() => setForm({ ...form, paymentOption: "none" })}
                  title="Reserve without payment"
                  subtitle="We'll hold the room as pending until the hotel confirms" />
              </div>
            </section>

            {err && <div className="text-sm text-destructive">{err}</div>}

            <button type="submit" disabled={busy || nights < 1} className="btn-primary w-full">
              {busy ? "Working…" : form.paymentOption === "none" ? "Submit reservation" : `Pay ${sym}${dueNow.toLocaleString()} & reserve`}
            </button>
          </form>

          {/* Summary */}
          <aside className="surface-card p-6 md:p-8 h-fit lg:sticky lg:top-24">
            <h3 className="font-display text-xl">Stay summary</h3>
            <dl className="mt-5 space-y-3 text-sm">
              <Row k="Room" v={room.name} />
              <Row k="Rate" v={`${sym}${Number(room.price_per_night).toLocaleString()} / night`} />
              <Row k="Nights" v={String(nights)} />
              <Row k="Rooms" v={String(form.numRooms)} />
              <div className="border-t border-border pt-3" />
              <Row k="Subtotal" v={`${sym}${baseTotal.toLocaleString()}`} />
              <Row k="Due now" v={`${sym}${dueNow.toLocaleString()}`} bold />
            </dl>
          </aside>
        </div>
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={bold ? "font-semibold text-base" : ""}>{v}</dd>
    </div>
  );
}
function PayOption({
  selected, onSelect, title, subtitle,
}: { selected: boolean; onSelect: () => void; title: string; subtitle: string }) {
  return (
    <button type="button" onClick={onSelect}
      className={`text-left rounded-xl border p-4 transition ${
        selected ? "border-foreground bg-accent/40" : "border-border hover:bg-accent/30"
      }`}>
      <div className="flex items-center gap-3">
        <span className={`size-4 rounded-full border ${selected ? "bg-foreground border-foreground" : "border-muted-foreground"}`} />
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}
