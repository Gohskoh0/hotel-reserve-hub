// Server-only admin session config + password helpers.
// Used by admin server functions to authenticate the admin panel.

import { useSession } from "@tanstack/react-start/server";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

export const ADMIN_DEFAULT_USERNAME = "admin";
export const ADMIN_DEFAULT_PASSWORD = "ChangeMe!2026";

export type AdminSessionData = {
  adminId?: string;
  username?: string;
};

export function adminSessionConfig() {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET is not configured");
  }
  return {
    password,
    name: "lakewood-admin-session",
    maxAge: 60 * 60 * 8, // 8 hours
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export async function getAdminSession() {
  return useSession<AdminSessionData>(adminSessionConfig());
}

export function hashPassword(password: string, saltHex?: string) {
  const salt = saltHex ? Buffer.from(saltHex, "hex") : randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return { hash: hash.toString("hex"), salt: salt.toString("hex") };
}

export function verifyPassword(password: string, hashHex: string, saltHex: string) {
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), 64);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
