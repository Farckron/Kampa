# STAGE 01 — Scaffold + CI

Goal: empty-but-deployable site. `npm run build` green, deploy workflow live.

- [x] `npm create astro@latest` (minimal template, TypeScript strict) in repo
      root; clean sample content
- [x] Add Tailwind v4 (`@tailwindcss/vite` per current Astro docs)
- [x] Add React integration (`@astrojs/react`), React 19
- [x] Init shadcn (`npx shadcn@latest init`), add `.mcp.json` with shadcn MCP
      server; components dir `src/components/ui/`
- [x] Base layout: `src/layouts/Base.astro` — html shell, meta, CSP meta tag
      (SPEC §2.3), self-hosted font (pick during design pass), canonical from
      `site` config
- [x] `astro.config.mjs`: `site` set to GitHub Pages URL (+ `base` if project
      page), sitemap integration
- [x] robots.txt, empty llms.txt placeholder, 404 page
- [x] vitest setup + one passing placeholder test; `npm run test` script
- [x] Playwright setup (config only, no tests yet)
- [x] `.github/workflows/deploy.yml`: push to main → withastro/action →
      deploy-pages; verify live URL (live-URL verification pending user repo)
- [x] Prettier config; `npm run format`
- [x] docs/PROGRESS.md created

Done when: pushed to main deploys a blank Base-layout page to GitHub Pages.
