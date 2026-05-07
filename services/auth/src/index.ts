/**
 * @analytics/auth — Bun-based passkey auth service for multi-operator
 * deployments. Phase 6 production path.
 *
 * Single-tenant: anyone with the URL can register the FIRST passkey;
 * subsequent registrations require an authenticated session. The dashboard
 * client switches between local-only WebAuthn (no server) and this service
 * automatically based on whether `AUTH_BASE_URL` is configured.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { setCookie, getCookie } from "hono/cookie";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { AuthStore } from "./db";

const RP_NAME = "Analytics";
const RP_ID = process.env.RP_ID ?? "localhost";
const ORIGIN = process.env.ORIGIN ?? `https://${RP_ID}`;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const SESSION_COOKIE = "analytics_session";

const store = new AuthStore(process.env.DATABASE_PATH ?? "./auth.db");

const challenges = new Map<string, { challenge: string; expiresAt: number }>();
function setChallenge(userId: string, challenge: string): void {
  challenges.set(userId, { challenge, expiresAt: Date.now() + 5 * 60 * 1000 });
}
function consumeChallenge(userId: string): string | null {
  const entry = challenges.get(userId);
  challenges.delete(userId);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.challenge;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of challenges) if (v.expiresAt < now) challenges.delete(k);
  store.pruneExpired();
}, 60 * 1000);

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") ?? "*",
    credentials: true,
  }),
);

app.get("/healthz", (c) => c.json({ status: "ok", service: "analytics-auth" }));

app.get("/auth/me", (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return c.json({ authenticated: false });
  const session = store.resolveSession(token);
  if (!session) return c.json({ authenticated: false });
  return c.json({ authenticated: true, userId: session.userId });
});

app.post("/auth/register/options", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { username?: string };
  const username = body.username ?? "operator";
  const { id: userId } = store.ensureUser(username);
  const existing = store.getCredentialsForUser(userId);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: username,
    userID: new TextEncoder().encode(userId),
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
    excludeCredentials: existing.map((cred) => ({
      id: cred.id,
      transports: cred.transports.split(",").filter(Boolean) as AuthenticatorTransportFuture[],
    })),
  });
  setChallenge(userId, options.challenge);
  return c.json({ ...options, userId });
});

app.post("/auth/register/verify", async (c) => {
  const body = (await c.req.json()) as { userId?: string; response?: unknown };
  if (!body.userId || !body.response) return c.json({ error: "bad request" }, 400);
  const challenge = consumeChallenge(body.userId);
  if (!challenge) return c.json({ error: "challenge expired" }, 400);

  const verification = await verifyRegistrationResponse({
    response: body.response as Parameters<typeof verifyRegistrationResponse>[0]["response"],
    expectedChallenge: challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return c.json({ error: "verification failed" }, 400);
  }

  const { credential } = verification.registrationInfo;
  store.insertCredential({
    id: credential.id,
    userId: body.userId,
    publicKey: Buffer.from(credential.publicKey).toString("base64"),
    counter: credential.counter,
    transports: (credential.transports ?? []).join(","),
    createdAt: Date.now(),
  });

  const token = store.createSession(body.userId, SESSION_TTL_MS);
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: ORIGIN.startsWith("https"),
    sameSite: "Strict",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return c.json({ verified: true });
});

app.post("/auth/login/options", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { username?: string };
  const username = body.username ?? "operator";
  const { id: userId } = store.ensureUser(username);
  const existing = store.getCredentialsForUser(userId);
  if (existing.length === 0) return c.json({ error: "no credentials registered" }, 404);

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "preferred",
    allowCredentials: existing.map((cred) => ({
      id: cred.id,
      transports: cred.transports.split(",").filter(Boolean) as AuthenticatorTransportFuture[],
    })),
  });
  setChallenge(userId, options.challenge);
  return c.json({ ...options, userId });
});

app.post("/auth/login/verify", async (c) => {
  const body = (await c.req.json()) as { userId?: string; response?: { id?: string; rawId?: string } & Record<string, unknown> };
  if (!body.userId || !body.response) return c.json({ error: "bad request" }, 400);
  const credId = body.response.id ?? body.response.rawId;
  if (!credId) return c.json({ error: "missing credential id" }, 400);
  const stored = store.getCredentialById(credId);
  if (!stored || stored.userId !== body.userId) {
    return c.json({ error: "credential not found" }, 404);
  }
  const challenge = consumeChallenge(body.userId);
  if (!challenge) return c.json({ error: "challenge expired" }, 400);

  const verification = await verifyAuthenticationResponse({
    response: body.response as Parameters<typeof verifyAuthenticationResponse>[0]["response"],
    expectedChallenge: challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    credential: {
      id: stored.id,
      publicKey: new Uint8Array(Buffer.from(stored.publicKey, "base64")),
      counter: stored.counter,
    },
  });

  if (!verification.verified) return c.json({ error: "verification failed" }, 400);

  store.updateCredentialCounter(stored.id, verification.authenticationInfo.newCounter);
  const token = store.createSession(stored.userId, SESSION_TTL_MS);
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: ORIGIN.startsWith("https"),
    sameSite: "Strict",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return c.json({ verified: true });
});

app.post("/auth/logout", (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) store.deleteSession(token);
  setCookie(c, SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return c.json({ ok: true });
});

const port = Number(process.env.PORT ?? 3001);
console.log(`analytics-auth listening on :${port}, RP_ID=${RP_ID}, ORIGIN=${ORIGIN}`);
export default {
  port,
  fetch: app.fetch,
};

type AuthenticatorTransportFuture =
  | "ble"
  | "cable"
  | "hybrid"
  | "internal"
  | "nfc"
  | "smart-card"
  | "usb";
