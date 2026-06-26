// Room types: public list (active rooms), admin CRUD.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin.functions";

export type RoomType = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price_per_night: number;
  capacity: number;
  total_inventory: number;
  amenities: string[];
  active: boolean;
  sort_order: number;
};

export const listPublicRooms = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("room_types")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RoomType[];
});

export const getRoomById = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("room_types")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    return row as RoomType | null;
  });

export const listAdminRooms = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("room_types")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RoomType[];
});

const roomSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(""),
  image_url: z.string().trim().max(2000).default(""),
  price_per_night: z.number().min(0).max(10_000_000),
  capacity: z.number().int().min(1).max(20),
  total_inventory: z.number().int().min(0).max(10_000),
  amenities: z.array(z.string().trim().max(80)).max(40).default([]),
  active: z.boolean().default(true),
  sort_order: z.number().int().min(0).max(10_000).default(0),
});

export const upsertRoom = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof roomSchema>) => roomSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await supabaseAdmin.from("room_types").update(rest).eq("id", id);
      if (error) throw error;
      return { ok: true as const, id };
    }
    const { id: _ignore, ...insertData } = data;
    const { data: row, error } = await supabaseAdmin
      .from("room_types")
      .insert(insertData)
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true as const, id: row.id };
  });

export const deleteRoom = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Block deletion when bookings reference this room
    const { count } = await supabaseAdmin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("room_type_id", data.id);
    if ((count ?? 0) > 0) {
      // Soft-delete: just deactivate
      const { error } = await supabaseAdmin
        .from("room_types")
        .update({ active: false })
        .eq("id", data.id);
      if (error) throw error;
      return { ok: true as const, softDeleted: true };
    }
    const { error } = await supabaseAdmin.from("room_types").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true as const, softDeleted: false };
  });
