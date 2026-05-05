require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const PORT = Number(process.env.PORT) || 4000;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "[backend] Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment. " +
      "Copy .env.example to .env and fill in your project credentials."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const app = express();
app.use(cors());
app.use(express.json({ limit: "32kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/collect", async (req, res) => {
  const { url, referrer, device_type } = req.body ?? {};

  if (typeof url !== "string" || url.length === 0 || url.length > 2048) {
    return res.status(400).json({ error: "invalid url" });
  }

  const row = {
    url,
    referrer: typeof referrer === "string" ? referrer.slice(0, 2048) : null,
    device_type:
      typeof device_type === "string" ? device_type.slice(0, 32) : null,
    timestamp: new Date().toISOString(),
  };

  const { error } = await supabase.from("page_views").insert(row);

  if (error) {
    console.error("[backend] insert failed:", error.message);
    return res.status(500).json({ error: "insert failed" });
  }

  return res.status(204).end();
});

app.get("/stats/summary", async (_req, res) => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("page_views")
    .select("url, device_type, referrer, timestamp")
    .gte("timestamp", since);

  if (error) {
    console.error("[backend] summary failed:", error.message);
    return res.status(500).json({ error: "query failed" });
  }

  return res.json({
    range: "7d",
    total_views: data.length,
    rows: data,
  });
});

app.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT}`);
});
