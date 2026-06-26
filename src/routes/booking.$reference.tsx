import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { getPublicSettings } from "@/lib/settings.functions";
import { getBookingByReference } from "@/lib/bookings.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const settingsQuery = queryOptions({
  queryKey: ["public-settings"],
  queryFn: () => getPublicSettings(),
});

export const Route = createFileRoute("/booking/$reference")({
  validateSearch: z.object({ paymentError: z.string().optional() }),
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(settingsQuery);
    await context.queryClient.ensureQueryData({
      queryKey: ["booking", params.reference],
      queryFn: () => getBookingByReference({ data: { reference: params.reference } }),
    });
  },
  head: () => ({ meta: [{ title: "Booking confirmation — Lakewood Hotel" }] }),
  component: BookingConfirmPage,
});

function BookingConfirmPage() {
  const { reference } = Route.useParams();
  const search = Route.useSearch();
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const { data: booking } = useSuspenseQuery({
    queryKey: ["booking", reference],
    queryFn: () => getBookingByReference({ data: { reference } }),
  });

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader hotelName={settings.name} />
        <main className="container-page py-24 text-center flex-1">
          <h1 className="font-display text-3xl">Booking not found</h1>
          <p className="mt-2 text-muted-foreground">We couldn't find a reservation with that reference.</p>
          <Link to="/" className="btn-ghost mt-6 inline-flex">Return home</Link>
        </main>
        <SiteFooter settings={settings} />
      </div>
    );
  }

  const sym = settings.currency_symbol;
  const status = booking.status;
  const payStatus = booking.payment_status;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader hotelName={settings.name} />
      <main className="flex-1 container-page py-16 max-w-2xl">
        <p className="field-label">Reservation</p>
        <h1 className="font-display text-4xl">
          {status === "confirmed" ? "You're booked!" : status === "pending" ? "Reservation received" : "Reservation"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Reference <span className="font-mono text-foreground">{booking.reference}</span>
        </p>

        {search.paymentError && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Payment could not be initialized: {search.paymentError}. Your reservation is held as pending —
            the hotel will reach out to complete payment.
          </div>
        )}

        <div className="surface-card mt-8 p-6 space-y-3 text-sm">
          <Row k="Status" v={status} />
          <Row k="Payment" v={payStatus} />
          <Row k="Room" v={booking.room_name} />
          <Row k="Check-in" v={booking.check_in} />
          <Row k="Check-out" v={booking.check_out} />
          <Row k="Rooms" v={String(booking.num_rooms)} />
          <Row k="Guests" v={String(booking.num_guests)} />
          <div className="border-t border-border pt-3" />
          <Row k="Total" v={`${sym}${Number(booking.total_amount).toLocaleString()}`} />
          <Row k="Paid" v={`${sym}${Number(booking.paid_amount).toLocaleString()}`} />
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          A confirmation will be sent to <span className="text-foreground">{booking.guest_email}</span>.
        </p>
        <Link to="/" className="btn-ghost mt-6 inline-flex">Back to home</Link>
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="capitalize">{v}</dd>
    </div>
  );
}
