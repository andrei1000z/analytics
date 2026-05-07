// Supabase Edge Function — beacon ingest endpoint.
//
// Receives encrypted events from the tracker via:
//   POST <project>.supabase.co/functions/v1/e?s=<roomId-hex>
//   Content-Type: text/plain  (CORS-simple, no preflight)
//   Body: iv (12B) || AES-GCM(eventJson)
//
// The Edge Function is the only path that inserts into the `events` table —
// it uses the service role key (server-side secret) so the public anon key
// can stay read-only. IP-hash bot detection is handled by Supabase's edge
// rate limiting + the per-row WAL consumption (free tier limits are gentle).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const HOUR_MS = 60 * 60 * 1000;
const MIN_BODY = 12 + 16; // IV + AES-GCM tag
const MAX_BODY = 16 * 1024;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization",
  "Access-Control-Max-Age": "86400",
};

function hexDecode(s: string): Uint8Array | null {
  if (s.length !== 64) return null;
  const out = new Uint8Array(32);
  for (let i = 0; i < 64; i += 2) {
    const hi = parseHexNibble(s.charCodeAt(i));
    const lo = parseHexNibble(s.charCodeAt(i + 1));
    if (hi < 0 || lo < 0) return null;
    out[i / 2] = (hi << 4) | lo;
  }
  return out;
}

function parseHexNibble(c: number): number {
  if (c >= 48 && c <= 57) return c - 48;
  if (c >= 97 && c <= 102) return c - 97 + 10;
  if (c >= 65 && c <= 70) return c - 65 + 10;
  return -1;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }

  const url = new URL(req.url);
  const siteHex = url.searchParams.get("s");
  if (!siteHex) {
    return new Response("missing s", { status: 400, headers: cors });
  }
  const siteId = hexDecode(siteHex);
  if (!siteId) {
    return new Response("bad siteId", { status: 400, headers: cors });
  }

  const ab = await req.arrayBuffer();
  const body = new Uint8Array(ab);
  if (body.length < MIN_BODY || body.length > MAX_BODY) {
    return new Response("bad body", { status: 400, headers: cors });
  }

  const now = Date.now();
  const bucket = now - (now % HOUR_MS);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("events").insert({
    site_id: siteId,
    time_bucket: bucket,
    received_at: now,
    ciphertext: body,
  });

  if (error) {
    console.error("insert failed", error);
    return new Response("insert failed", { status: 500, headers: cors });
  }

  return new Response(null, { status: 202, headers: cors });
});
