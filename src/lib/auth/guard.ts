import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { findAdminUserById } from "@/lib/content/store";
import { OWNER_ID, SESSION_COOKIE, verifySessionToken } from "./session";

/** A valid session whose account still exists; removed users are signed out immediately. */
export async function getAdminSession() {
  const store = await cookies();
  const session = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  if (session.uid === OWNER_ID) {
    return process.env.ADMIN_PASSWORD_HASH && session.sub === process.env.ADMIN_USERNAME
      ? session
      : null;
  }
  const user = await findAdminUserById(session.uid);
  return user && user.username === session.sub ? session : null;
}

/** For admin pages: bounces unauthenticated visitors to the login screen. */
export async function requireAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/**
 * For admin API routes: returns an error response when the caller is not an
 * authenticated admin or the request is cross-origin, otherwise null.
 */
export async function guardAdminApi(
  request: NextRequest
): Promise<NextResponse | null> {
  if (request.method !== "GET" && !isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }
  return null;
}

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}
