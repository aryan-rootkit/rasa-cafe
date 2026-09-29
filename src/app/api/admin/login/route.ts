import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isSameOrigin } from "@/lib/auth/guard";
import { verifyPassword } from "@/lib/auth/password";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
  recordFailedLogin,
} from "@/lib/auth/rate-limit";
import {
  OWNER_ID,
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { findAdminUserByUsername } from "@/lib/content/store";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const expectedUser = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedUser || !passwordHash || (process.env.AUTH_SECRET ?? "").length < 32) {
    console.error("Admin login is not configured. See .env.example.");
    return NextResponse.json(
      { error: "Admin login is not configured on this server." },
      { status: 503 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  const limit = checkLoginRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter your username and password." },
      { status: 400 }
    );
  }

  const { username, password } = parsed.data;
  const isOwner = safeEqual(username, expectedUser);
  const account = isOwner ? null : await findAdminUserByUsername(username);
  const passwordOk = await verifyPassword(
    password,
    isOwner ? passwordHash : account?.passwordHash
  );

  if (!passwordOk || (!isOwner && !account)) {
    recordFailedLogin(ip);
    return NextResponse.json(
      { error: "Incorrect username or password." },
      { status: 401 }
    );
  }

  clearLoginAttempts(ip);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    SESSION_COOKIE,
    isOwner
      ? createSessionToken(expectedUser, OWNER_ID)
      : createSessionToken(account!.username, account!.id),
    sessionCookieOptions
  );
  return response;
}
