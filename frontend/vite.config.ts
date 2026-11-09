import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import fs from "node:fs";
import prefixer from "postcss-prefix-selector";
import { spawnSync } from "node:child_process";

// API calls go to /api/v1 on the same origin; nginx (deploy/nginx) proxies them to Flask.
/** Build the legacy module runtime (public/legacy) while the config loads — i.e. BEFORE Vite indexes
 *  public/ — so `vite`, `vite build`, `vite preview` and `npm run dev` always serve it. Skipped when
 *  the output is newer than every legacy source file. */
(function buildLegacyRuntime() {
  const out = path.resolve(__dirname, "public/legacy/legacy-app.js");
  const srcDir = path.resolve(__dirname, "legacy/src");
  const inputs = [...fs.readdirSync(srcDir).map((f) => path.join(srcDir, f)), path.resolve(__dirname, "legacy/build-legacy.mjs")];
  const outTime = fs.existsSync(out) ? fs.statSync(out).mtimeMs : 0;
  const stale = !fs.existsSync(path.resolve(__dirname, "public/legacy/vendor/qrcode.js")) || inputs.some((f) => fs.statSync(f).mtimeMs > outTime);
  const errFile = path.resolve(__dirname, "public/legacy/BUILD-ERROR.txt");
  if (!stale) return;
  // Never block Vite: if the module build fails, native screens still run and module screens show the reason.
  const r = spawnSync(process.execPath, [path.resolve(__dirname, "legacy/build-legacy.mjs")], { encoding: "utf8" });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.status === 0) { if (fs.existsSync(errFile)) fs.rmSync(errFile); return; }
  const msg = (r.stderr || "") + (r.error ? String(r.error) : "") || "unknown error (exit " + r.status + ")";
  console.error("\n[msea] Module runtime build FAILED. Native screens will work; module screens (/app/...) will show this message.\n" + msg);
  fs.mkdirSync(path.dirname(errFile), { recursive: true }); fs.writeFileSync(errFile, msg);
})();

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "Eduvia",
        short_name: "MSEA",
        description: "MS Education Academy ERP — fees, admissions, attendance, HR, gaps",
        theme_color: "#0f4c81",
        background_color: "#f5f7fb",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // legacy-app.js (all original modules) is precached for offline use
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          { urlPattern: /\/api\/v1\/(auth\/me|branches|fees\/heads|gaps\/meta|admissions\/stages|attendance\/statuses)/, handler: "NetworkFirst", options: { cacheName: "api-ref", expiration: { maxAgeSeconds: 86400 } } },
          { urlPattern: /\/api\/v1\//, handler: "NetworkOnly" }
        ]
      }
    })
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  // The app's own stylesheet is scoped under .nx so it never collides with the legacy runtime's CSS (scoped under .lg).
  css: { postcss: { plugins: [prefixer({ prefix: ".nx", transform(prefix: string, selector: string, prefixed: string) {
    if (selector === ".nx" || selector === "*" || selector.startsWith("html") || selector.startsWith("body") || selector === "#root") return selector;
    if (selector.startsWith(":root")) return selector;
    // exclude the legacy runtime subtree (.lg) so platform styles never leak into legacy screens
    const m = prefixed.match(/^(.*?)(::[a-z-]+)?$/); return `${m![1]}:not(.lg *)${m![2] ?? ""}`; } }) as never] } },
  server: {
  port: 5173,
  proxy: {
    "/api": "http://127.0.0.1:5000",
    "/health": "http://127.0.0.1:5000"
  }
},
  build: { sourcemap: false, target: "es2020" }
});
