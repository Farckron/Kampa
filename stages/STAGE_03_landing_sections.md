# STAGE 03 — Landing sections + static pages

Goal: full landing hero-to-footer + FAQ/privacy/terms/guide pages.

- [x] `HowItWorks.astro` — 3 numbered cards + cost caption (SPEC §3.2)
- [x] `Features.astro` — 6-card grid (SPEC §3.3)
- [x] `Comparison.astro` — 4-column honest table + closing paragraph
      (SPEC §3.4)
- [x] `Samples.astro` — tabbed viewer (CSS-only tabs or minimal inline
      script exception — justify) with 3 sample plan excerpts
      — CSS-only: radio inputs + named Tailwind peers, no script needed.
- [x] Write 3 full sample plans (coffee shop Riga, hair salon, e-commerce
      boutique) as content collection entries; `/samples/[slug]` pages
      (these are hand-crafted with Claude's help, quality bar: genuinely
      impressive — they are the demo AND the SEO meat)
- [x] `FAQ.astro` accordion (native `<details>`) — 6 approved items +
      standalone /faq page; JSON-LD FAQPage
- [x] `FinalCta.astro` — dark band (SPEC §3.7)
- [x] `/guide/api-key` — illustrated step-by-step: console.anthropic.com
      signup, billing, create key, set spend cap, paste into Kampa; HowTo
      JSON-LD
- [x] /privacy (key handling, no-server architecture, plain language) and
      /terms
- [x] JSON-LD SoftwareApplication on index; OG images at build time
      — NUANCE: shipped one static `public/og.png` (Playwright screenshot of
      the hero at 1200x630) referenced by every page, not per-page images
      generated during `astro build`. Per-page generation needs a satori or
      sharp pipeline, i.e. a new runtime dependency the fence does not allow
      without asking. Revisit in stage 07 if per-page OG is wanted.
- [x] llms.txt filled in

Note: the tier-1 e2e guard no longer asserts zero `<script` tags. JSON-LD is
data, not executed JS, so the assertion is now "every `<script` present is
`type="application/ld+json"`" across /, /faq and a sample page.

Done when: entire landing + all static pages deployed, Lighthouse holds ≥95.

- Lighthouse: 2026-07-25, Lighthouse 13.4.1 `--preset=desktop` against
  `npm run build && npm run preview` (http://localhost:4321). `/`,
  `/faq` and `/samples/riga-coffee-shop` each scored
  **100 performance / 100 accessibility / 100 best-practices / 100 SEO**.
  Budget in SPEC §5 (≥95) holds.
- Deploy: still blocked on the user's repo, same as the stage-01 deploy-workflow
  entry. The workflow is committed and the build is green, but nothing is live,
  so "deployed" is unverified and the Lighthouse numbers above are from the
  local preview build, not a production URL. Also pending the repo: the real
  GitHub URL, a one-line swap in `src/lib/site.ts`.
