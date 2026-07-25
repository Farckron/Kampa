# Stage 02 — Design System + Landing Shell Plan (Workflow execution)

**Goal:** Visual language locked; nav + hero + footer live on `/`. First real look.

**Decisions (user-approved):** accent **emerald `#059669`**; font **Schibsted Grotesk** (variable, self-hosted woff2, latin subset); white-only theme (dead dark-mode block deleted).

**Execution:** ultracode Workflow, branch `stage-02-design`. Phases:

1. **Foundation** (1 agent): design tokens in `src/styles/global.css` — accent emerald mapped into shadcn vars (`--primary` etc.), type scale for huge display headlines, delete unused `.dark` block + `@custom-variant dark`; self-host Schibsted Grotesk (woff2 in `src/assets/fonts/` or `public/fonts/`, `@font-face`, preload in Base.astro, `font-family` wired); favicon: simple SVG wordmark ("K" on near-black rounded square) + base-aware `<link rel="icon">` in Base.astro; commit.
2. **Components** (3 parallel agents, write-only, no commits): `src/components/landing/Nav.astro`, `Hero.astro`, `Footer.astro`. Copy verbatim from SPEC §3.1/§3.8; base-aware internal links (`import.meta.env.BASE_URL`); zero client JS (CSS-only mobile nav); GitHub icon inline SVG.
3. **Integrate** (1 agent): compose `index.astro` (Nav+Hero+Footer), responsive 360→1440, fix seams; tier-1 guard Playwright spec (`tests/e2e/tier1.spec.ts`: zero `<script>` in landing HTML, no request to any non-origin host) + playwright webServer gains build step; full gate (`build+test+typecheck+test:e2e`); commits; bookkeeping (stage file checkboxes, PROGRESS.md).
4. **Review** (1 opus agent): whole-stage diff vs SPEC/CLAUDE.md constraints; conditional fix agent + gate re-run.

**Global constraints:** CLAUDE.md Tier 1 (no third-party requests — font must be committed, not fetched at runtime; zero client JS on landing; deps fence — no new deps; CSP untouched). Approved copy is law (SPEC §3). Conventional commits.

**Deferred in:** favicon (from Stage 01 ledger), guard spec (final-review rec), webServer build step (ledger minor).
**Deferred out:** Lighthouse ≥95 verification happens on first deployed URL (no deploy target yet).
