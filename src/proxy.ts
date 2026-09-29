import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "rasa_admin_session";
const PUBLIC_PAGES = ["/admin/login", "/admin/signup"];
const PUBLIC_APIS = ["/api/admin/login", "/api/admin/signup"];

// Optimistic gate only (cookie present); every admin page and API route verifies the session.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PAGES.includes(pathname) || PUBLIC_APIS.includes(pathname);
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (isPublic || hasSession) {
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
