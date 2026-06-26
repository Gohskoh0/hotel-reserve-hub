// Admin server functions: login, logout, ensure default admin, change credentials, session check.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function ensureDefaultAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error: countErr } = await supabaseAdmin
    .from("admin_users")
    .select("id", { count: "exact", head: true });
  if (countErr) throw countErr;
  if ((count ?? 0) > 0) return;

  const { hashPassword, ADMIN_DEFAULT_USERNAME, ADMIN_DEFAULT_PASSWORD } = await import(
    "./admin-session.server"
  );
  const { hash, salt } = hashPassword(ADMIN_DEFAULT_PASSWORD);
  const { error } = await supabaseAdmin.from("admin_users").insert({
    username: ADMIN_DEFAULT_USERNAME,
    password_hash: hash,
    password_salt: salt,
    must_change_password: true,
  });
  if (error && !error.message.includes("duplicate")) throw error;
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; password: string }) =>
    z
      .object({
        username: z.string().trim().min(1).max(64),
        password: z.string().min(1).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await ensureDefaultAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { verifyPassword, getAdminSession } = await import("./admin-session.server");

    const { data: user, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("username", data.username)
      .maybeSingle();
    if (error) throw error;
    if (!user) return { ok: false as const, error: "Invalid username or password" };

    const ok = verifyPassword(data.password, user.password_hash, user.password_salt);
    if (!ok) return { ok: false as const, error: "Invalid username or password" };

    const session = await getAdminSession();
    await session.update({ adminId: user.id, username: user.username });
    return { ok: true as const, mustChangePassword: user.must_change_password };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { getAdminSession } = await import("./admin-session.server");
  const session = await getAdminSession();
  await session.clear();
  return { ok: true as const };
});

export const adminMe = createServerFn({ method: "GET" }).handler(async () => {
  await ensureDefaultAdmin();
  const { getAdminSession } = await import("./admin-session.server");
  const session = await getAdminSession();
  if (!session.data.adminId) return { authenticated: false as const };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("id, username, must_change_password")
    .eq("id", session.data.adminId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    await session.clear();
    return { authenticated: false as const };
  }
  return {
    authenticated: true as const,
    username: data.username,
    mustChangePassword: data.must_change_password,
  };
});

export async function requireAdmin() {
  const { getAdminSession } = await import("./admin-session.server");
  const session = await getAdminSession();
  if (!session.data.adminId) throw new Error("Unauthorized");
  return { adminId: session.data.adminId, username: session.data.username };
}

export const adminChangeCredentials = createServerFn({ method: "POST" })
  .inputValidator((d: { currentPassword: string; newUsername: string; newPassword: string }) =>
    z
      .object({
        currentPassword: z.string().min(1),
        newUsername: z.string().trim().min(3).max(64),
        newPassword: z.string().min(8).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { adminId } = await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { verifyPassword, hashPassword } = await import("./admin-session.server");

    const { data: user, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("id", adminId)
      .single();
    if (error) throw error;

    if (!verifyPassword(data.currentPassword, user.password_hash, user.password_salt)) {
      return { ok: false as const, error: "Current password is incorrect" };
    }

    const { hash, salt } = hashPassword(data.newPassword);
    const { error: upErr } = await supabaseAdmin
      .from("admin_users")
      .update({
        username: data.newUsername,
        password_hash: hash,
        password_salt: salt,
        must_change_password: false,
      })
      .eq("id", adminId);
    if (upErr) {
      if (upErr.message.includes("duplicate")) {
        return { ok: false as const, error: "Username already taken" };
      }
      throw upErr;
    }

    const { getAdminSession } = await import("./admin-session.server");
    const session = await getAdminSession();
    await session.update({ adminId, username: data.newUsername });

    return { ok: true as const };
  });
