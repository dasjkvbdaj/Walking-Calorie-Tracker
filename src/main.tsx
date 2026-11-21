import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import iconUrl from "./icon.png";
import "./index.css";
import App from "./App";

function applyAppIconAndManifest(href: string) {
  const setLink = (rel: string, sizes?: string) => {
    let el = document.querySelector<HTMLLinkElement>(
      sizes ? `link[rel="${rel}"][sizes="${sizes}"]` : `link[rel="${rel}"]`,
    );
    if (!el) {
      el = document.createElement("link");
      el.rel = rel;
      if (sizes) el.sizes = sizes;
      document.head.appendChild(el);
    }
    el.href = href;
  };

  setLink("icon");
  setLink("apple-touch-icon", "180x180");

  const ogImage = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
  if (ogImage) ogImage.content = href;

  const twitterImage = document.querySelector<HTMLMetaElement>('meta[name="twitter:image"]');
  if (twitterImage) twitterImage.content = href;

  const manifest = {
    name: "Cadence",
    short_name: "Cadence",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0A0C0B",
    theme_color: "#0A0C0B",
    icons: [
      {
        src: href,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: href,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };

  const manifestBlob = new Blob([JSON.stringify(manifest)], {
    type: "application/manifest+json",
  });
  const manifestUrl = URL.createObjectURL(manifestBlob);

  let manifestEl = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!manifestEl) {
    manifestEl = document.createElement("link");
    manifestEl.rel = "manifest";
    document.head.appendChild(manifestEl);
  }
  manifestEl.href = manifestUrl;
}

function registerPwaServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const swCode = `
    self.addEventListener("install", () => {
      self.skipWaiting();
    });
    self.addEventListener("activate", (event) => {
      event.waitUntil(self.clients.claim());
    });
    self.addEventListener("fetch", (event) => {
      if (event.request.mode === "navigate") {
        event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
      }
    });
  `;

  const swBlob = new Blob([swCode], { type: "application/javascript" });
  const swUrl = URL.createObjectURL(swBlob);

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(swUrl).catch(() => {});
  });
}

applyAppIconAndManifest(iconUrl);
registerPwaServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
