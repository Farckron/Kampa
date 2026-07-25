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
