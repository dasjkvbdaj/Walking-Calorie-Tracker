import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import iconUrl from "./icon.png";
import "./index.css";
import App from "./App";

function applyAppIcon(href: string) {
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
}

applyAppIcon(iconUrl);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
