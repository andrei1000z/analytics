// Build pipeline: esbuild → IIFE → minified → gzip-size assert (≤1024 B).
// Also copies the built tracker.js into apps/dashboard/public/t.js so the
// Vercel-hosted dashboard serves it under the same origin (visitors embed
// `<script src="https://<dashboard-host>/t.js#…">`).
import { build } from "esbuild";
import { gzipSync } from "node:zlib";
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here);
const dist = join(root, "dist");
const out = join(dist, "tracker.js");
const outGz = join(dist, "tracker.js.gz");
const dashboardPublic = resolve(root, "..", "..", "apps", "dashboard", "public");
const dashboardCopy = join(dashboardPublic, "t.js");

const BUDGET_BYTES = 1024;

mkdirSync(dist, { recursive: true });

await build({
  entryPoints: [join(root, "src/index.ts")],
  bundle: true,
  minify: true,
  target: "es2020",
  format: "iife",
  legalComments: "none",
  outfile: out,
  logLevel: "warning",
});

const raw = readFileSync(out);
const gz = gzipSync(raw, { level: 9 });
writeFileSync(outGz, gz);

const rawSize = statSync(out).size;
const gzSize = gz.byteLength;

const fmt = (n) => `${n.toString().padStart(4)} B`;
const pct = ((gzSize / BUDGET_BYTES) * 100).toFixed(1);

console.log(`tracker.js     ${fmt(rawSize)}    raw`);
console.log(`tracker.js.gz  ${fmt(gzSize)}    gzip (budget ${BUDGET_BYTES} B → ${pct}%)`);

if (gzSize > BUDGET_BYTES) {
  console.error(`FAIL: gzipped tracker (${gzSize} B) exceeds 1024 B budget`);
  process.exit(1);
}
console.log("OK: under 1024 B gzipped budget");

// Mirror into apps/dashboard/public/t.js so `pnpm --filter @analytics/dashboard build`
// includes it in the Vercel deploy. Self-hosted CDN can serve it from the
// dashboard origin without a separate hop.
mkdirSync(dashboardPublic, { recursive: true });
copyFileSync(out, dashboardCopy);
console.log(`also copied → apps/dashboard/public/t.js`);
