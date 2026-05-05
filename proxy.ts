import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, isAuthorized } from "./app/lib/auth";

export function proxy(request: NextRequest) {
  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (isAuthorized(cookie)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  if (request.nextUrl.pathname !== "/") {
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run on every route except: login page, auth endpoints, the public tracker
  // ingest endpoint, the tracker script, Next.js internals, and static assets.
  matcher: [
    "/((?!login|api/auth|api/collect|script\\.js|_next/static|_next/image|favicon\\.ico|.*\\.svg$).*)",
  ],
};
