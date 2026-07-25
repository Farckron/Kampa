// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Deploy target not chosen yet (see plan Global Constraints).
// Before first real deploy set: SITE = "https://<user>.github.io", BASE = "/<repo>/".
// BASE must keep its trailing slash: import.meta.env.BASE_URL is used as `base + 'app'`.
// When a custom domain arrives: SITE = "https://<domain>", BASE = "/".
const SITE = "https://example.invalid";
const BASE = "/";

export default defineConfig({
  site: SITE,
  base: BASE,
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
