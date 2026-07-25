# STAGE 07 — SEO/GEO + launch readiness

Goal: findable, fast, credible; ready for Product Hunt/HN/Reddit.

- [x] Meta/OG audit every page; OG images generated at build
- [x] 5 launch blog posts (Layer 1/2 keywords from SPEC §5 / research §4.2):
      e.g. "Marketing plan for a small business with a €500 budget",
      "Free Jasper alternative that doesn't store your data", "What a €1
      AI marketing campaign looks like", "How to get a Claude API key and
      cap your spend", "Facebook vs Instagram for a Latvian small business"
- [x] RSS feed; sitemap verified; llms.txt final
- [x] JSON-LD validated (Rich Results test)
- [x] Lighthouse ≥95 all pages; bundle size check on /app island
- [x] README.md: what/why/architecture/trust model (repo is a marketing
      asset); LICENSE (MIT)
- [x] Security self-review: grep for key leakage paths, CSP verified on
      deployed site, storage behavior verified
- [~] Cross-browser: Chrome, Firefox, Safari (incl. iOS)
- [x] Launch checklist doc: PH/HN/Indie Hackers/r/smallbusiness angles
      ("static site, BYOK, no server, no data" for HN)

Done when: site live, fast, indexed; launch checklist ready. Custom domain +
Latvian locale + programmatic vertical pages = post-launch backlog.

## Notes

- Lighthouse: 2026-07-25 audit of the **live** site
  (https://farckron.github.io/Kampa/) scored
  **100 performance / 100 accessibility / 100 best-practices / 100 SEO**.
  This supersedes the preview-only numbers recorded in stage 03. SPEC §5
  budget (≥95) holds with room. The `/app` island is the only page shipping
  JavaScript; every other page ships zero, enforced by `tests/e2e/tier1.spec.ts`.
- Cross-browser is `[~]`, not `[x]`. Chromium is covered by the Playwright
  suite (10 specs, including the full wizard against an intercepted API).
  Firefox and Safari/iOS need a manual pass, which is task 3 of the pre-flight
  list in `docs/LAUNCH.md`. Marked honestly rather than ticked, because the
  wizard is the only page with JS and it is the only one that could break.
- Meta/OG audit: all 17 built pages carry a unique title and description, a
  correct base-aware canonical, and og:title/description/image. One gap found
  and fixed: `404.astro` was not passing `noindex` to `Base.astro`. `Base.astro`
  also gained the `<link rel="alternate" type="application/rss+xml">` pointing
  at `/Kampa/rss.xml`.
- JSON-LD: `SoftwareApplication` on `/`, `FAQPage` on `/faq`, `HowTo` on
  `/guide/api-key`, `BlogPosting` on each of the five posts. All parse.
- Security self-review is `docs/SECURITY_SELF_REVIEW.md`. Zero defects, one
  residual risk documented, method recorded as re-runnable commands.
- Open for the user, all in `docs/LAUNCH.md`: the .ics import test, the
  real-key quality pass on three personas, and the Firefox/Safari sweep.
