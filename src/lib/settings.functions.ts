// Hotel settings: public read + admin update (incl. write-only Paystack secret).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin.functions";

export type PublicSettings = {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  hero_image_url: string;
  about: string;
  deposit_percent: number;
  currency: string;
  currency_symbol: string;
  paystack_public_key: string;
};

export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("hotel_settings")
    .select(
      "name, tagline, address, phone, email, hero_image_url, about, deposit_percent, currency, currency_symbol, paystack_public_key",
    )
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data as PublicSettings;
});

export const getAdminSettings = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("hotel_settings")
    .select(
      "name, tagline, address, phone, email, hero_image_url, about, deposit_percent, currency, currency_symbol, paystack_public_key, paystack_secret_key",
    )
    .eq("id", 1)
    .single();
  if (error) throw error;
  // NEVER return the raw secret key to the client. Only a "configured" flag.
  const { paystack_secret_key, ...rest } = data;
  return {
    ...(rest as PublicSettings),
    paystack_secret_configured: Boolean(paystack_secret_key && paystack_secret_key.length > 0),
  };
});

const settingsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  tagline: z.string().trim().max(200).default(""),
  address: z.string().trim().max(500).default(""),
  phone: z.string().trim().max(60).default(""),
  email: z.string().trim().max(120).default(""),
  hero_image_url: z.string().trim().max(2000).default(""),
  about: z.string().trim().max(4000).default(""),
  deposit_percent: z.number().int().min(1).max(99),
  currency: z.string().trim().min(2).max(8),
  currency_symbol: z.string().trim().min(1).max(8),
  paystack_public_key: z.string().trim().max(200).default(""),
});

export const updateSettings = createServerFn({ method: "POST" })
  .inputValidator((d: z.infer<typeof settingsSchema>) => settingsSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("hotel_settings").update(data).eq("id", 1);
    if (error) throw error;
    return { ok: true as const };
  });

export const updatePaystackSecret = createServerFn({ method: "POST" })
  .inputValidator((d: { secretKey: string }) =>
    z.object({ secretKey: z.string().trim().min(10).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("hotel_settings")
      .update({ paystack_secret_key: data.secretKey })
      .eq("id", 1);
    if (error) throw error;
    return { ok: true as const };
  });

export const clearPaystackSecret = createServerFn({ method: "POST" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("hotel_settings")
    .update({ paystack_secret_key: "" })
    .eq("id", 1);
  if (error) throw error;
  return { ok: true as const };
});
