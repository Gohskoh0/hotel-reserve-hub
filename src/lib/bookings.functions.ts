// Bookings: availability check, create booking, list/update for admin.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { requireAdmin } from "./admin.functions";

function generateReference() {
  return "LWH-" + randomBytes(4).toString("hex").toUpperCase();
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + "T00:00:00Z").getTime();
  const b = new Date(checkOut + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86_400_000);
}

const availSchema = z.object({
  roomTypeId: z.string().uuid(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  numRooms: z.number().int().min(1).max(20),
});

export const checkAvailability = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof availSchema>) => availSchema.parse(d))
  .handler(async ({ data }) => {
    if (new Date(data.checkOut) <= new Date(data.checkIn)) {
      return { available: false as const, error: "Check-out must be after check-in" };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: room, error: rErr } = await supabaseAdmin
      .from("room_types")
      .select("id, name, price_per_night, capacity, total_inventory, active")
      .eq("id", data.roomTypeId)
      .maybeSingle();
    if (rErr) throw rErr;
    if (!room || !room.active) return { available: false as const, error: "Room not available" };
    if (data.numRooms > room.total_inventory) {
      return { available: false as const, error: "Not enough rooms of this type exist" };
    }

    // Find overlapping bookings (not cancelled). Overlap = check_in < requested_out AND check_out > requested_in.
    const { data: overlaps, error: bErr } = await supabaseAdmin
      .from("bookings")
      .select("num_rooms, check_in, check_out, status")
      .eq("room_type_id", data.roomTypeId)
      .neq("status", "cancelled")
      .lt("check_in", data.checkOut)
      .gt("check_out", data.checkIn);
    if (bErr) throw bErr;

    // For each date in the requested range, sum overlapping booked rooms.
    const start = new Date(data.checkIn + "T00:00:00Z").getTime();
    const end = new Date(data.checkOut + "T00:00:00Z").getTime();
    let maxBookedOnAnyDay = 0;
    for (let t = start; t < end; t += 86_400_000) {
      let booked = 0;
      for (const b of overlaps ?? []) {
        const bStart = new Date(b.check_in + "T00:00:00Z").getTime();
        const bEnd = new Date(b.check_out + "T00:00:00Z").getTime();
        if (t >= bStart && t < bEnd) booked += b.num_rooms;
      }
      if (booked > maxBookedOnAnyDay) maxBookedOnAnyDay = booked;
    }
    const remaining = room.total_inventory - maxBookedOnAnyDay;
    const ok = remaining >= data.numRooms;
    return {
      available: ok,
      remaining,
      nights: nightsBetween(data.checkIn, data.checkOut),
      pricePerNight: Number(room.price_per_night),
      total: Number(room.price_per_night) * data.numRooms * nightsBetween(data.checkIn, data.checkOut),
      error: ok ? undefined : `Only ${remaining} room(s) left for those dates`,
    };
  });

const createSchema = z.object({
  roomTypeId: z.string().uuid(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  numRooms: z.number().int().min(1).max(20),
  numGuests: z.number().int().min(1).max(40),
  guestName: z.string().trim().min(1).max(120),
  guestEmail: z.string().trim().email().max(200),
  guestPhone: z.string().trim().min(3).max(40),
  notes: z.string().trim().max(2000).default(""),
  paymentOption: z.enum(["full", "deposit", "none"]),
});

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof createSchema>) => createSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: room, error: rErr } = await supabaseAdmin
      .from("room_types")
      .select("id, name, price_per_night, total_inventory, active")
      .eq("id", data.roomTypeId)
      .single();
    if (rErr) throw rErr;
    if (!room.active) throw new Error("Room no longer available");

    // Re-check availability server-side
    const { data: overlaps } = await supabaseAdmin
      .from("bookings")
      .select("num_rooms, check_in, check_out")
      .eq("room_type_id", data.roomTypeId)
      .neq("status", "cancelled")
      .lt("check_in", data.checkOut)
      .gt("check_out", data.checkIn);
    const start = new Date(data.checkIn + "T00:00:00Z").getTime();
    const end = new Date(data.checkOut + "T00:00:00Z").getTime();
    let maxBooked = 0;
    for (let t = start; t < end; t += 86_400_000) {
      let booked = 0;
      for (const b of overlaps ?? []) {
        const bs = new Date(b.check_in + "T00:00:00Z").getTime();
        const be = new Date(b.check_out + "T00:00:00Z").getTime();
        if (t >= bs && t < be) booked += b.num_rooms;
      }
      if (booked > maxBooked) maxBooked = booked;
    }
    if (room.total_inventory - maxBooked < data.numRooms) {
      throw new Error("Not enough rooms available for those dates");
    }

    const { data: settings } = await supabaseAdmin
      .from("hotel_settings")
      .select("deposit_percent")
      .eq("id", 1)
      .single();
    const depositPct = settings?.deposit_percent ?? 20;

    const nights = nightsBetween(data.checkIn, data.checkOut);
    if (nights < 1) throw new Error("Stay must be at least one night");
    const total = Number(room.price_per_night) * data.numRooms * nights;
    let amountDue = 0;
    if (data.paymentOption === "full") amountDue = total;
    else if (data.paymentOption === "deposit") amountDue = Math.round(total * (depositPct / 100) * 100) / 100;

    const reference = generateReference();
    const { data: booking, error: insErr } = await supabaseAdmin
      .from("bookings")
      .insert({
        reference,
        guest_name: data.guestName,
        guest_email: data.guestEmail,
        guest_phone: data.guestPhone,
        notes: data.notes,
        check_in: data.checkIn,
        check_out: data.checkOut,
        num_guests: data.numGuests,
        num_rooms: data.numRooms,
        room_type_id: room.id,
        room_type_name: room.name,
        price_per_night: room.price_per_night,
        nights,
        total_amount: total,
        amount_due_now: amountDue,
        amount_paid: 0,
        payment_option: data.paymentOption,
        payment_status: "unpaid",
        status: data.paymentOption === "none" ? "pending" : "pending",
      })
      .select("*")
      .single();
    if (insErr) throw insErr;

    return {
      ok: true as const,
      reference: booking.reference,
      id: booking.id,
      total,
      amountDue,
      depositPercent: depositPct,
    };
  });

export const getBookingByReference = createServerFn({ method: "GET" })
  .inputValidator((d: { reference: string }) =>
    z.object({ reference: z.string().trim().min(3).max(40) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("reference", data.reference)
      .maybeSingle();
    if (error) throw error;
    return row;
  });

export const listAdminBookings = createServerFn({ method: "GET" })
  .inputValidator((d: { status?: string }) =>
    z.object({ status: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("bookings").select("*").order("created_at", { ascending: false });
    if (data.status && data.status !== "all") q = q.eq("status", data.status as any);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const updateBookingStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status: "pending" | "confirmed" | "cancelled" | "completed" }) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });
