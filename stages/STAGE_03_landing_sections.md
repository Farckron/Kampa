# STAGE 03 — Landing sections + static pages

Goal: full landing hero-to-footer + FAQ/privacy/terms/guide pages.

- [ ] `HowItWorks.astro` — 3 numbered cards + cost caption (SPEC §3.2)
- [ ] `Features.astro` — 6-card grid (SPEC §3.3)
- [ ] `Comparison.astro` — 4-column honest table + closing paragraph
      (SPEC §3.4)
- [ ] `Samples.astro` — tabbed viewer (CSS-only tabs or minimal inline
      script exception — justify) with 3 sample plan excerpts
- [ ] Write 3 full sample plans (coffee shop Riga, hair salon, e-commerce
      boutique) as content collection entries; `/samples/[slug]` pages
      (these are hand-crafted with Claude's help, quality bar: genuinely
      impressive — they are the demo AND the SEO meat)
- [ ] `FAQ.astro` accordion (native `<details>`) — 6 approved items +
      standalone /faq page; JSON-LD FAQPage
- [ ] `FinalCta.astro` — dark band (SPEC §3.7)
- [ ] `/guide/api-key` — illustrated step-by-step: console.anthropic.com
      signup, billing, create key, set spend cap, paste into Kampa; HowTo
      JSON-LD
- [ ] /privacy (key handling, no-server architecture, plain language) and
      /terms
- [ ] JSON-LD SoftwareApplication on index; OG images at build time
- [ ] llms.txt filled in

Done when: entire landing + all static pages deployed, Lighthouse holds ≥95.
