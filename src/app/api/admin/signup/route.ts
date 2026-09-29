import { NextResponse, type NextRequest } from "next/server";
import { isSameOrigin } from "@/lib/auth/guard";
import { hashPassword } from "@/lib/auth/password";
import { checkLoginRateLimit, recordFailedLogin } from "@/lib/auth/rate-limit";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { firstIssue, signupInputSchema } from "@/lib/content/schema";
import { createAdminUser } from "@/lib/content/store";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if ((process.env.AUTH_SECRET ?? "").length < 32) {
    console.error("Admin sign-up is not configured. See .env.example.");
    return NextResponse.json(
      { error: "Sign-up isn't available on this server." },
      { status: 503 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  // Every attempt counts, successful or not, to cap how many accounts one visitor can create.
  const limitKey = `signup:${ip}`;
  const limit = checkLoginRateLimit(limitKey);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Too many sign-up attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }
  recordFailedLogin(limitKey);

  const parsed = signupInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  const { username, password } = parsed.data;

  if (username === process.env.ADMIN_USERNAME?.toLowerCase()) {
    return NextResponse.json({ error: "That username is taken." }, { status: 409 });
  }

  const user = await createAdminUser(username, await hashPassword(password));
  if (!user) {
    return NextResponse.json({ error: "That username is taken." }, { status: 409 });
  }

  const response = NextResponse.json({ ok: true }, { status: 201 });
  response.cookies.set(
    SESSION_COOKIE,
    createSessionToken(user.username, user.id),
    sessionCookieOptions
  );
  return response;
}
