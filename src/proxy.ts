import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

const PUBLIC_PAGES = ["/admin/login", "/admin/signup"];
const PUBLIC_APIS = ["/api/admin/login", "/api/admin/signup"];

// Optimistic gate only; every admin page and API route re-checks the session.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PAGES.includes(pathname) || PUBLIC_APIS.includes(pathname);
  const session = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (PUBLIC_PAGES.includes(pathname) && session) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  if (isPublic || session) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
