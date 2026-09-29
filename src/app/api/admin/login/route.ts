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
import {
  describeStorageError,
  StorageNotConnectedError,
  storageConnected,
} from "@/lib/storage";

const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(100),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!storageConnected) {
    return NextResponse.json({ error: new StorageNotConnectedError().message }, { status: 503 });
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

  // Optional extra account defined by ADMIN_USERNAME / ADMIN_PASSWORD_HASH.
  const ownerName = process.env.ADMIN_USERNAME?.toLowerCase();
  const ownerHash = process.env.ADMIN_PASSWORD_HASH;
  const isOwner = Boolean(ownerName && ownerHash && username === ownerName);

  let token: string;
  try {
    const account = isOwner ? null : await findAdminUserByUsername(username);
    const passwordOk = await verifyPassword(
      password,
      isOwner ? ownerHash : account?.passwordHash
    );

    if (!passwordOk || (!isOwner && !account)) {
      recordFailedLogin(ip);
      return NextResponse.json(
        { error: "Incorrect username or password." },
        { status: 401 }
      );
    }

    token = isOwner
      ? await createSessionToken(process.env.ADMIN_USERNAME!, OWNER_ID)
      : await createSessionToken(account!.username, account!.id);
  } catch (error) {
    console.error("Admin login failed", error);
    return NextResponse.json({ error: describeStorageError(error) }, { status: 503 });
  }

  clearLoginAttempts(ip);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}
