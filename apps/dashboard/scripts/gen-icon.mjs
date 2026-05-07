// Generate PWA + favicon set from icon-source.svg using sharp.
// Run with: pnpm gen:icon

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const svgPath = join(root, "icon-source.svg");
const publicDir = join(root, "public");
const iconsDir = join(publicDir, "icons");

await mkdir(publicDir, { recursive: true });
await mkdir(iconsDir, { recursive: true });

const svg = await readFile(svgPath);

const targets = [
  { out: join(publicDir, "favicon-16.png"), size: 16 },
  { out: join(publicDir, "favicon-32.png"), size: 32 },
  { out: join(publicDir, "apple-touch-icon.png"), size: 180 },
  { out: join(iconsDir, "icon-192.png"), size: 192 },
  { out: join(iconsDir, "icon-512.png"), size: 512 },
  // Maskable icon: padded so the safe zone fits within ~80% of the viewport.
  { out: join(iconsDir, "icon-512-maskable.png"), size: 512, padPct: 12 },
  { out: join(iconsDir, "icon-1024.png"), size: 1024 },
];

for (const t of targets) {
  if (t.padPct) {
    const inner = Math.round(t.size * (1 - (t.padPct * 2) / 100));
    const padded = await sharp(svg).resize(inner, inner).toBuffer();
    await sharp({
      create: {
        width: t.size,
        height: t.size,
        channels: 4,
        background: "#003399",
      },
    })
      .composite([{ input: padded, gravity: "center" }])
      .png()
      .toFile(t.out);
  } else {
    await sharp(svg).resize(t.size, t.size).png().toFile(t.out);
  }
  console.log(`  ${String(t.size).padStart(4)}px → ${t.out.replace(root, "apps/dashboard")}`);
}

console.log("OK: PWA + favicon set regenerated.");
