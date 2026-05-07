/**
 * Zero-knowledge crypto helpers (per directive 5.1).
 *
 *   roomId  = PBKDF2-HMAC-SHA-256(passphrase, "salt-room-v1", 200_000)  // 32 bytes → public hex
 *   siteKey = PBKDF2-HMAC-SHA-256(passphrase, "salt-key-v1",  200_000)  // 32 bytes → AES-GCM key
 *
 * The passphrase NEVER leaves the device. The server only ever learns
 * `roomId` (a deterministic but irreversible derivative).
 */

const ITERATIONS = 200_000;
const SALT_ROOM = "salt-room-v1";
const SALT_KEY = "salt-key-v1";

async function deriveBits(passphrase: string, saltStr: string, bits: number): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(saltStr),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    bits,
  );
}

export async function deriveRoomId(passphrase: string): Promise<string> {
  const buf = await deriveBits(passphrase, SALT_ROOM, 256);
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

export async function deriveSiteKey(passphrase: string): Promise<CryptoKey> {
  const buf = await deriveBits(passphrase, SALT_KEY, 256);
  return crypto.subtle.importKey("raw", buf, { name: "AES-GCM" }, false, ["decrypt"]);
}

/** Decrypts a `(iv || ciphertext-with-tag)` payload. Throws on auth failure. */
export async function decryptEvent(siteKey: CryptoKey, body: Uint8Array): Promise<unknown> {
  if (body.length < 12 + 16) throw new Error("ciphertext too short");
  const iv = body.slice(0, 12);
  const ct = body.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, siteKey, ct);
  const json = new TextDecoder().decode(plain);
  return JSON.parse(json);
}

export function base64ToBytes(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
