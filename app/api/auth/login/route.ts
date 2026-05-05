import { NextResponse } from "next/server";
import { AUTH_COOKIE, expectedCookieValue } from "../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { password?: unknown };

export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const cookieValue = expectedCookieValue();

  if (!adminPassword || !cookieValue) {
    return NextResponse.json(
      { error: "Auth not configured. Set ADMIN_PASSWORD and AUTH_SECRET." },
      { status: 500 }
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const submitted = typeof body.password === "string" ? body.password : "";
  if (submitted !== adminPassword) {
    return NextResponse.json(
      { error: "Parolă incorectă." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: AUTH_COOKIE,
    value: cookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
