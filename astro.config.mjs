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
  // No code blocks in our markdown (sample plans); Shiki's inline styles are
  // CSP-incompatible, so highlighting stays off. Prism if a blog post ever needs it.
  markdown: { syntaxHighlight: false },
  // SPEC §2.3 CSP. Astro emits the <meta> and hashes its own inline hydration
  // bootstrap, so /app can carry a React island without 'unsafe-inline' scripts.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "connect-src 'self' https://api.anthropic.com",
        "img-src 'self' data:",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ],
      // Radix sets inline style attributes (progress bar transform); attributes
      // cannot be hashed, so they get their own directive.
      styleDirective: {
        resources: [
          { resource: "'self'", kind: "element" },
          { resource: "'unsafe-inline'", kind: "attribute" },
        ],
      },
    },
  },
  vite: { plugins: [tailwindcss()] },
});
