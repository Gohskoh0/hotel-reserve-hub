// Paystack: initialize a transaction (server-side) and verify it on callback.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function getSecretKey(): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("hotel_settings")
    .select("paystack_secret_key")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data?.paystack_secret_key || null;
}

export const initPaystackForBooking = createServerFn({ method: "POST" })
  .inputValidator((d: { bookingReference: string; callbackUrl: string }) =>
    z
      .object({
        bookingReference: z.string().trim().min(3).max(40),
        callbackUrl: z.string().url().max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: booking, error: bErr } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("reference", data.bookingReference)
      .single();
    if (bErr) throw bErr;
    if (booking.payment_option === "none") {
      return { ok: false as const, error: "This booking does not require payment" };
    }
    if (booking.payment_status === "paid") {
      return { ok: false as const, error: "Booking already paid" };
    }
    const secret = await getSecretKey();
    if (!secret) {
      return { ok: false as const, error: "Payments are not yet configured by the hotel." };
    }
    const amountKobo = Math.round(Number(booking.amount_due_now) * 100);
    const { data: settings } = await supabaseAdmin
      .from("hotel_settings")
      .select("currency")
      .eq("id", 1)
      .single();

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: booking.guest_email,
        amount: amountKobo,
        currency: settings?.currency || "NGN",
        reference: `${booking.reference}-${Date.now()}`,
        callback_url: data.callbackUrl,
        metadata: {
          booking_reference: booking.reference,
          booking_id: booking.id,
        },
      }),
    });
    const json = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url: string; reference: string };
    };
    if (!res.ok || !json.status || !json.data) {
      return { ok: false as const, error: json.message || "Could not initialize payment" };
    }
    await supabaseAdmin
      .from("bookings")
      .update({ paystack_reference: json.data.reference })
      .eq("id", booking.id);
    return { ok: true as const, authorizationUrl: json.data.authorization_url };
  });

export const verifyPaystackTransaction = createServerFn({ method: "POST" })
  .inputValidator((d: { reference: string }) =>
    z.object({ reference: z.string().trim().min(3).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const secret = await getSecretKey();
    if (!secret) return { ok: false as const, error: "Payments not configured" };
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const json = (await res.json()) as {
      status?: boolean;
      data?: {
        status: string;
        amount: number;
        metadata?: { booking_reference?: string };
        reference: string;
      };
    };
    if (!res.ok || !json.status || !json.data) {
      return { ok: false as const, error: "Verification failed" };
    }
    const bookingRef = json.data.metadata?.booking_reference;
    if (!bookingRef) return { ok: false as const, error: "Missing booking reference" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("reference", bookingRef)
      .single();
    if (error) throw error;

    if (json.data.status === "success") {
      const paid = json.data.amount / 100;
      const newTotalPaid = Number(booking.amount_paid) + paid;
      const newStatus =
        booking.payment_option === "full"
          ? "paid"
          : booking.payment_option === "deposit"
            ? "deposit_paid"
            : booking.payment_status;
      await supabaseAdmin
        .from("bookings")
        .update({
          amount_paid: newTotalPaid,
          payment_status: newStatus,
          status: "confirmed",
          paystack_reference: json.data.reference,
        })
        .eq("id", booking.id);
      return { ok: true as const, bookingReference: bookingRef };
    }
    return { ok: false as const, error: "Payment was not successful", bookingReference: bookingRef };
  });
