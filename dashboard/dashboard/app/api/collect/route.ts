import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function withCors(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
  return res;
}

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

type Payload = {
  url?: unknown;
  referrer?: unknown;
  device_type?: unknown;
};

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return withCors(
      NextResponse.json({ error: "invalid json" }, { status: 400 })
    );
  }

  const url = clean(body.url, 2048);
  if (!url) {
    return withCors(NextResponse.json({ error: "invalid url" }, { status: 400 }));
  }

  const row = {
    url,
    referrer: clean(body.referrer, 2048),
    device_type: clean(body.device_type, 32)?.toLowerCase() ?? null,
    timestamp: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from("page_views").insert(row);

  if (error) {
    console.error("[api/collect] insert failed:", error.message);
    return withCors(
      NextResponse.json({ error: "insert failed" }, { status: 500 })
    );
  }

  return withCors(new NextResponse(null, { status: 204 }));
}
