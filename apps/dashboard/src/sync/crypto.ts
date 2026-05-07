/**
 * Zero-knowledge crypto helpers (per directive 5.1).
 *
 *   roomId  = PBKDF2-HMAC-SHA-256(passphrase, "salt-room-v1", 200_000) → 32B → public hex
 *   siteKey = PBKDF2-HMAC-SHA-256(passphrase, "salt-key-v1",  200_000) → 32B → AES-GCM key
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

function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

export type DerivedKeys = {
  /** 64-char hex of the room derivative (public, server learns). */
  roomId: string;
  /** AES-GCM CryptoKey for decryption. */
  siteKey: CryptoKey;
  /** Base64url-encoded raw key bytes — used in the embed URL fragment. */
  keyHex: string;
};

export async function deriveKeys(passphrase: string): Promise<DerivedKeys> {
  const [roomBuf, keyBuf] = await Promise.all([
    deriveBits(passphrase, SALT_ROOM, 256),
    deriveBits(passphrase, SALT_KEY, 256),
  ]);
  const roomId = bytesToHex(new Uint8Array(roomBuf));
  const keyHex = bytesToBase64Url(new Uint8Array(keyBuf));
  const siteKey = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  return { roomId, siteKey, keyHex };
}

export async function deriveRoomId(passphrase: string): Promise<string> {
  const buf = await deriveBits(passphrase, SALT_ROOM, 256);
  return bytesToHex(new Uint8Array(buf));
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

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
