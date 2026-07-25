# PROGRESS

One line per completed task: date · stage · task · commit · note.

- 2026-07-25 · planning · SPEC.md, CLAUDE.md, stages/, research report written · — · design approved section-by-section in brainstorming session
- 2026-07-25 · stage01 · Astro project scaffold · 5fa46e1 · minimal Astro 7 template in repo root, sample content cleaned out.
- 2026-07-25 · stage01 · Config — site/base, Tailwind v4, React, sitemap · 7eb1fe1 · `@tailwindcss/vite` + `@astrojs/react` + sitemap wired; SITE/BASE left as documented placeholders pending the user's repo.
- 2026-07-25 · stage01 · Base layout with CSP + canonical · 4143bf3 · `Base.astro` html shell with SPEC §2.3 CSP meta tag and canonical derived from `site`.
- 2026-07-25 · stage01 · Static plumbing — robots.txt, llms.txt, 404 · 1db45c5 (+fix 6719346) · crawl plumbing and 404 page added; follow-up made the 404 home link base-aware.
- 2026-07-25 · stage01 · Test toolchains — vitest + Playwright config · 9ee7cff · vitest with one passing smoke test, Playwright config only (no e2e tests yet).
- 2026-07-25 · stage01 · shadcn init + MCP + Prettier · e14c289 (+fix 289971d) · shadcn initialised into `src/components/ui/`, `.mcp.json` server and Prettier config added; follow-up moved build-only shadcn tooling to devDependencies.
- 2026-07-25 · stage01 · GitHub Actions deploy workflow · 4455ecf · push-to-main → withastro/action → deploy-pages; live-URL verification still blocked on the user's repo.
- 2026-07-25 · stage02 · Landing shell — Nav, Hero, Footer composed in `index.astro` · a337c5a · CSS-only mobile menu, shared `max-w-6xl px-6` container, SPEC §3.1/§3.8 copy verbatim, no horizontal scroll 360→1440px, empty `#how-it-works` anchor left for stage 03.
- 2026-07-25 · stage02 · Tier-1 guard e2e spec · 0c50faa · Playwright asserts zero `<script` tags and zero third-party requests on `/`; webServer now runs `build && preview`.
- 2026-07-25 · stage03 · Sample plans + `samples` content collection · 468b815 · three hand-written 90-day plans behind a glob loader + zod schema; `/samples` index and `/samples/[slug]` pages with hand-styled markdown (no typography plugin) and tables that scroll inside the table box.
- 2026-07-25 · stage03 · Tier-1 guard spec covers JSON-LD and more pages · 4a9e75c · zero-`<script` assertion replaced with "every `<script` must be `application/ld+json`"; both guards now sweep `/`, `/faq` and a sample page.
- 2026-07-25 · stage03 · FAQ accordion, /faq, /guide/api-key, /privacy, /terms · 88fd420 · native `<details>` accordion with the 6 approved items + FAQPage JSON-LD; API-key guide as styled step cards (no screenshots) with HowTo JSON-LD.
- 2026-07-25 · stage03 · Landing composed, OG meta, llms.txt · a821176 · Hero→HowItWorks→Features→Comparison→Samples→Faq→FinalCta; CSS-only radio tabs in Samples fed by the collection; SoftwareApplication JSON-LD; static `public/og.png` hero screenshot wired into `og:image`/`twitter:card`; no horizontal scroll at 360/768/1440.
