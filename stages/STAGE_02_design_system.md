# STAGE 02 — Design system + landing shell

Goal: visual language locked; nav + hero + footer live.

- [ ] Design tokens in Tailwind theme: colors (white bg, near-black text,
      one accent — propose 3 accents, user picks), type scale (huge display
      headline sizes), spacing, border style for cards
- [ ] Self-hosted variable font chosen and wired (subset, woff2, preload)
- [ ] `Nav.astro`: logo wordmark, links (How it works, FAQ, Blog, GitHub
      icon), CTA button "Open the app"; mobile menu CSS-only
- [ ] `Hero.astro`: approved headline/subhead/CTAs/trust line (SPEC §3.1) +
      campaign-package CSS mockup + BUILT FOR strip
- [ ] `Footer.astro`: columns + oversized flat wordmark (SPEC §3.8)
- [ ] `index.astro` composes Nav + Hero + Footer; responsive 360px→1440px
- [ ] Lighthouse on deployed page ≥95 all categories

Done when: deployed landing shows polished hero, nav, footer; zero client JS.
