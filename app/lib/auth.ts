export const AUTH_COOKIE = "ea_auth";

export function expectedCookieValue(): string | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return secret;
}

export function isAuthorized(cookieValue: string | undefined): boolean {
  const expected = expectedCookieValue();
  if (!expected) return false;
  return cookieValue === expected;
}
