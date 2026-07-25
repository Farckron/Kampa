# STAGE 02 — Design system + landing shell

Goal: visual language locked; nav + hero + footer live.

- [x] Design tokens in Tailwind theme: colors (white bg, near-black text,
      one accent — propose 3 accents, user picks), type scale (huge display
      headline sizes), spacing, border style for cards
- [x] Self-hosted variable font chosen and wired (subset, woff2, preload)
- [x] `Nav.astro`: logo wordmark, links (How it works, FAQ, Blog, GitHub
      icon), CTA button "Open the app"; mobile menu CSS-only
- [x] `Hero.astro`: approved headline/subhead/CTAs/trust line (SPEC §3.1) +
      campaign-package CSS mockup + BUILT FOR strip
- [x] `Footer.astro`: columns + oversized flat wordmark (SPEC §3.8)
- [x] `index.astro` composes Nav + Hero + Footer; responsive 360px→1440px
- [x] Lighthouse on deployed page ≥95 all categories — 2026-07-25 audit of the
      live site (https://farckron.github.io/Kampa/) scored
      **100 performance / 100 accessibility / 100 best-practices / 100 SEO**.
      Cross-browser: chromium tested (e2e suite); firefox and safari/iOS
      manual passes still pending, tracked in `docs/LAUNCH.md` pre-flight.

Done when: deployed landing shows polished hero, nav, footer; zero client JS.
