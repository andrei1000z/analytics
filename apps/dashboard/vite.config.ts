import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-16.png", "favicon-32.png", "apple-touch-icon.png"],
      manifest: {
        id: "/?source=pwa",
        name: "Analytics — EU privacy-first",
        short_name: "Analytics",
        description:
          "Privacy-first, EU-sovereign, zero-knowledge web analytics. AES-GCM-256 ciphertext at rest. No cookies, no IPs.",
        lang: "ro",
        dir: "ltr",
        categories: ["productivity", "business", "developer"],
        theme_color: "#003399",
        background_color: "#0a0a0c",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone"],
        orientation: "any",
        scope: "/",
        start_url: "/?source=pwa",
        prefer_related_applications: false,
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "/icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          { src: "/icons/icon-1024.png", sizes: "1024x1024", type: "image/png", purpose: "any" },
        ],
        shortcuts: [
          {
            name: "Site nou",
            short_name: "Site nou",
            description: "Adaugă un nou site cu passphrase E2E",
            url: "/?action=create-site",
          },
          {
            name: "Setări",
            short_name: "Setări",
            description: "Endpoint-uri ingest + tracker",
            url: "/?action=settings",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,ico,webmanifest}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // Don't skipWaiting automatically — let ReloadPrompt show a "new version"
        // toast and the user clicks Reload. Prevents the infinite-reload loops we
        // got when a deploy and an open tab raced.
        skipWaiting: false,
        navigateFallback: "index.html",
        // Allow the SW to receive { type: "SKIP_WAITING" } from ReloadPrompt.
        // (vite-plugin-pwa's generated SW wires this listener automatically when
        // skipWaiting is false but the ReloadPrompt posts the message.)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // Don't precache JS source maps — they bloat the SW + leak source paths.
      injectManifest: undefined,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
