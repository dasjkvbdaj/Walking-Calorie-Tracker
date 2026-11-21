import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cadencePwaPlugin(): Plugin {
  return {
    name: "cadence-pwa-assets",
    apply: "build",
    closeBundle() {
      const distDir = path.resolve(__dirname, "dist");
      const srcIconPath = path.resolve(__dirname, "src/icon.png");

      if (fs.existsSync(srcIconPath)) {
        const iconBuffer = fs.readFileSync(srcIconPath);
        const iconsDir = path.join(distDir, "icons");
        fs.mkdirSync(iconsDir, { recursive: true });
        fs.writeFileSync(path.join(iconsDir, "icon-192.png"), iconBuffer);
        fs.writeFileSync(path.join(iconsDir, "icon-512.png"), iconBuffer);
        fs.writeFileSync(path.join(distDir, "favicon.png"), iconBuffer);
      }

      const manifest = {
        name: "Cadence — Walking & Net Active Calorie Tracker",
        short_name: "Cadence",
        description: "Walking and net active calorie tracker",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#0A0C0B",
        theme_color: "#0A0C0B",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      };

      fs.writeFileSync(
        path.join(distDir, "manifest.webmanifest"),
        JSON.stringify(manifest, null, 2),
      );

      const swScript = `const CACHE_NAME = "cadence-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  );
});
`;

      fs.writeFileSync(path.join(distDir, "sw.js"), swScript);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), cadencePwaPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
