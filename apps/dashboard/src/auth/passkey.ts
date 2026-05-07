/**
 * Local-only WebAuthn passkey gate for the operator's dashboard session.
 *
 * Threat model: protect a dashboard tab from casual access by someone who
 * opened the operator's browser. The OS authenticator (Touch ID, Windows
 * Hello, security key) gates each session. The credential ID is stored in
 * localStorage, so this is per-browser-profile, per-device.
 *
 * NOT a substitute for proper account auth — for multi-operator deployments,
 * pair this with the `services/auth` Bun service which does full
 * @simplewebauthn/server-backed verification.
 */

const STORAGE_KEY = "analytics:passkey";

type StoredCredential = {
  /** Base64url-encoded credential rawId */
  id: string;
  /** Base64url-encoded random user handle (16 bytes) */
  userHandle: string;
  createdAt: number;
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function readStored(): StoredCredential | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredCredential;
    if (typeof parsed.id === "string" && typeof parsed.userHandle === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

export function hasPasskey(): boolean {
  return readStored() !== null;
}

export function clearPasskey(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export async function isPasskeySupported(): Promise<boolean> {
  if (typeof window.PublicKeyCredential === "undefined") return false;
  if (
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== "function"
  ) {
    return true; // Allow security-key path even if platform auth unavailable.
  }
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function registerPasskey(): Promise<void> {
  const userHandle = crypto.getRandomValues(new Uint8Array(16));
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: {
        name: "Analytics",
        // rp.id is auto-derived from origin if omitted (recommended for browser context).
      },
      user: {
        id: userHandle,
        name: "operator@analytics.local",
        displayName: "Operator Analytics",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        userVerification: "preferred",
        residentKey: "preferred",
      },
      attestation: "none",
      timeout: 60_000,
    },
  });
  if (!cred || cred.type !== "public-key") {
    throw new Error("Înregistrarea passkey-ului a fost anulată");
  }
  const pkc = cred as PublicKeyCredential;
  const stored: StoredCredential = {
    id: bytesToBase64Url(new Uint8Array(pkc.rawId)),
    userHandle: bytesToBase64Url(userHandle),
    createdAt: Date.now(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export async function authenticatePasskey(): Promise<void> {
  const stored = readStored();
  if (!stored) throw new Error("Niciun passkey înregistrat");
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const cred = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [
        {
          id: base64UrlToBytes(stored.id),
          type: "public-key",
        },
      ],
      userVerification: "preferred",
      timeout: 60_000,
    },
  });
  if (!cred || cred.type !== "public-key") {
    throw new Error("Autentificare cu passkey eșuată");
  }
}
