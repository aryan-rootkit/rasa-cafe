import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { getStoredAuthSecret } from "@/lib/content/store";

export const SESSION_COOKIE = "rasa_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;
/** Account id used in sessions for the optional admin defined by env vars. */
export const OWNER_ID = "owner";

export type SessionPayload = { sub: string; uid: string; iat: number; exp: number };

/** AUTH_SECRET if set, otherwise a random key generated once and kept in MongoDB. */
async function getSecret(): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) return secret;
  return getStoredAuthSecret();
}

async function sign(data: string): Promise<string> {
  return createHmac("sha256", await getSecret()).update(data).digest("base64url");
}

export async function createSessionToken(username: string, uid: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: username,
    uid,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${await sign(body)}`;
}

/**
 * Checks signature and expiry only. Whether the account still exists is
 * checked by `getAdminSession`, which can read the account store.
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  let expected: string;
  try {
    expected = await sign(body);
  } catch {
    return null;
  }
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
      return null;
    }
    if (typeof payload.sub !== "string" || typeof payload.uid !== "string") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
