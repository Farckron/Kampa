# Stage 01 — Scaffold + CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Empty-but-deployable Kampa site: Astro 7 + Tailwind v4 + React 19 + shadcn wired, test toolchains installed, GitHub Actions deploy to Pages green.

**Architecture:** Static Astro site; all interactivity later lives in one React island. This stage produces the skeleton only: base layout with CSP, config with parameterized site/base, CI pipeline.

**Tech Stack:** Astro 7, Tailwind CSS v4 (`@tailwindcss/vite`), React 19 (`@astrojs/react`), shadcn/ui, vitest, Playwright, GitHub Actions (`withastro/action`).

## Global Constraints

(from CLAUDE.md / SPEC.md — apply to every task)

- No backend, no server code. Static output only.
- No third-party scripts, no font CDNs, no analytics. CSP `connect-src` limited to `'self' https://api.anthropic.com`.
- API keys never in repo, config, tests, or commits. Tests use fake keys `sk-ant-test-...`.
- Runtime deps allowed: astro, react, react-dom, tailwindcss, shadcn/ui (+ direct radix deps), @astrojs/* official. Dev-only: vitest, playwright, typescript, prettier. Nothing else without asking.
- Landing pages ship zero client JS.
- Conventional commits; never commit a broken build.
- After each task: tick checkbox in `stages/STAGE_01_scaffold.md` where it maps, append one line to `docs/PROGRESS.md`.
- GitHub username/repo not yet chosen: `SITE`/`BASE` constants in `astro.config.mjs` hold placeholder values by deliberate decision (see Task 2). Deploy verification (Task 7, last step) is blocked until the user supplies them.

---

### Task 1: Astro project scaffold

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro` (via CLI)
- Modify: `.gitignore` (already exists — verify CLI didn't clobber `inspiration/` entry)

**Interfaces:**
- Produces: working `npm run dev` / `npm run build`; `dist/` output. All later tasks build on this project root.

- [ ] **Step 1: Scaffold in place**

The repo root already contains docs (`SPEC.md`, `CLAUDE.md`, `stages/`, `docs/`, `.gitignore`). Scaffold into the current directory:

```bash
npm create astro@latest . -- --template minimal --install --no-git --yes
```

If the CLI refuses a non-empty directory, scaffold into `/tmp/kampa-scaffold` and move `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/`, `public/` into the repo root (do not overwrite `.gitignore`; merge its Astro entries — `dist/`, `.astro/`, `node_modules/` are already present).

- [ ] **Step 2: Strict TypeScript**

Ensure `tsconfig.json` extends the strict preset:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```
Expected: exits 0, `dist/index.html` exists.

- [ ] **Step 4: Verify .gitignore intact**

```bash
grep -c "inspiration/" .gitignore
```
Expected: `1`. Also confirm `git status` shows no `inspiration/` or `node_modules/` files staged-able.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: scaffold astro project"
```

---

### Task 2: Config — site/base, Tailwind v4, React, sitemap

**Files:**
- Modify: `astro.config.mjs`
- Create: `src/styles/global.css`

**Interfaces:**
- Produces: `SITE`/`BASE` constants (fill-in point for GitHub URL); Tailwind classes usable in any `.astro`/`.tsx`; React islands renderable; sitemap at build.

- [ ] **Step 1: Add integrations**

```bash
npx astro add react --yes
npx astro add sitemap --yes
npm install tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Write astro.config.mjs**

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Deploy target not chosen yet (see plan Global Constraints).
// Before first real deploy set: SITE = "https://<user>.github.io", BASE = "/<repo>".
// When a custom domain arrives: SITE = "https://<domain>", BASE = "/".
const SITE = "https://example.invalid";
const BASE = "/";

export default defineConfig({
  site: SITE,
  base: BASE,
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 3: Global stylesheet**

```css
/* src/styles/global.css */
@import "tailwindcss";
```

- [ ] **Step 4: Use a Tailwind class in index.astro and verify**

In `src/pages/index.astro`:

```astro
---
import "../styles/global.css";
---
<h1 class="text-4xl font-bold">Kampa</h1>
```

```bash
npm run build && grep -o "text-4xl" dist/_astro/*.css | head -1
```
Expected: build passes; grep finds `text-4xl` (Tailwind emitted the utility).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add tailwind v4, react, sitemap, parameterized site config"
```

---

### Task 3: Base layout with CSP + canonical

**Files:**
- Create: `src/layouts/Base.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Produces: `Base.astro` with `Props { title: string; description: string }` — every later page wraps in it. CSP string below is the canonical one from SPEC §2.3; changing it requires a SPEC edit.

- [ ] **Step 1: Write Base.astro**

```astro
---
// src/layouts/Base.astro
import "../styles/global.css";

interface Props {
  title: string;
  description: string;
}
const { title, description } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; connect-src 'self' https://api.anthropic.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'"
    />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta name="generator" content={Astro.generator} />
  </head>
  <body class="bg-white text-neutral-950 antialiased">
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Wrap index in Base**

```astro
---
// src/pages/index.astro
import Base from "../layouts/Base.astro";
---
<Base
  title="Kampa — AI campaign planner for small businesses"
  description="Answer 8 questions, get a complete 90-day marketing campaign: channel plan, weekly calendar, ready-to-paste copy. Free — bring your own Claude API key."
>
  <h1 class="text-4xl font-bold">Kampa</h1>
</Base>
```

- [ ] **Step 3: Verify CSP + canonical in output**

```bash
npm run build && grep -c "Content-Security-Policy" dist/index.html && grep -c 'rel="canonical"' dist/index.html
```
Expected: both `1`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: base layout with CSP meta and canonical"
```

---

### Task 4: Static plumbing — robots.txt, llms.txt, 404

**Files:**
- Create: `public/robots.txt`, `public/llms.txt`, `src/pages/404.astro`

**Interfaces:**
- Produces: crawl plumbing; `404.astro` uses `Base.astro` from Task 3.

- [ ] **Step 1: robots.txt**

```
# public/robots.txt
User-agent: *
Allow: /

Sitemap: https://example.invalid/sitemap-index.xml
```

(Sitemap host is the SITE placeholder — same fill-in point as Task 2; note it in the file with a `#` comment.)

- [ ] **Step 2: llms.txt skeleton**

```
# public/llms.txt
# Kampa — free BYOK AI campaign planner for small businesses
# Full content added in Stage 07.

> Kampa generates complete 90-day marketing campaigns for small businesses
> in the browser, using the user's own Claude API key. No signup, no
> servers; the only network call is to api.anthropic.com.
```

- [ ] **Step 3: 404 page**

```astro
---
// src/pages/404.astro
import Base from "../layouts/Base.astro";
---
<Base title="Page not found — Kampa" description="This page does not exist.">
  <main class="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 text-center">
    <h1 class="text-6xl font-bold">404</h1>
    <p>That page doesn't exist.</p>
    <a href="/" class="underline">Back to Kampa</a>
  </main>
</Base>
```

- [ ] **Step 4: Verify**

```bash
npm run build && ls dist/404.html dist/robots.txt dist/llms.txt
```
Expected: all three listed.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: robots, llms.txt skeleton, 404 page"
```

---

### Task 5: Test toolchains — vitest + Playwright config

**Files:**
- Create: `vitest.config.ts`, `tests/unit/smoke.test.ts`, `playwright.config.ts`, `tests/e2e/.gitkeep`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces: `npm run test` (vitest, unit), `npm run test:e2e` (Playwright). Later stages put lib tests in `tests/unit/`, e2e in `tests/e2e/`.

- [ ] **Step 1: Install**

```bash
npm install -D vitest @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: vitest config + smoke test**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tests/unit/**/*.test.ts"] },
});
```

```ts
// tests/unit/smoke.test.ts
import { describe, expect, it } from "vitest";

describe("toolchain", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 3: Playwright config (no tests yet)**

```ts
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://localhost:4321" },
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 4: package.json scripts**

Merge into `"scripts"`:

```json
{
  "test": "vitest run",
  "test:e2e": "playwright test"
}
```

- [ ] **Step 5: Verify**

```bash
npm run test
```
Expected: 1 passed. (`test:e2e` runs with 0 tests — fine; passing `--pass-with-no-tests` not needed until Stage 5 adds specs.)

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "test: vitest and playwright toolchains"
```

---

### Task 6: shadcn init + MCP + Prettier

**Files:**
- Create: `components.json`, `src/components/ui/` (via CLI), `.mcp.json`, `.prettierrc`
- Modify: `src/styles/global.css` (shadcn init appends theme vars)

**Interfaces:**
- Produces: `npx shadcn@latest add <component>` works; components land in `src/components/ui/`; shadcn MCP available to agent sessions; `npm run format`.

- [ ] **Step 1: shadcn init**

```bash
npx shadcn@latest init
```
Answers: style **default/neutral**, CSS file `src/styles/global.css`, css variables **yes**, components alias `@/components`, utils alias `@/lib/utils`. If it asks for a framework, pick Astro/Vite. Verify `components.json` created and `global.css` gained `@theme`/var blocks.

- [ ] **Step 2: Path alias for @/**

Ensure `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

- [ ] **Step 3: Prove component install works, then remove it**

```bash
npx shadcn@latest add button
npm run build
```
Expected: `src/components/ui/button.tsx` exists, build green. Keep the button (Stage 2 uses it).

- [ ] **Step 4: .mcp.json**

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

- [ ] **Step 5: Prettier**

```bash
npm install -D prettier prettier-plugin-astro
```

```json
// .prettierrc
{
  "plugins": ["prettier-plugin-astro"]
}
```

Add script `"format": "prettier --write ."` and run it once:

```bash
npm run format && npm run build && npm run test
```
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: shadcn init, mcp config, prettier"
```

---

### Task 7: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: push to `main` builds and deploys to GitHub Pages. Final verification blocked on user supplying username/repo (Global Constraints).

- [ ] **Step 1: Write workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Local final check**

```bash
npm run build && npm run test
```
Expected: green.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "ci: github pages deploy workflow"
```

- [ ] **Step 4 (BLOCKED on user): first deploy**

When the user supplies `username/repo`:
1. Set `SITE`/`BASE` in `astro.config.mjs` and the Sitemap line in `public/robots.txt`; commit.
2. User creates the GitHub repo, sets Pages → Source → **GitHub Actions**.
3. `git remote add origin git@github.com:<user>/<repo>.git && git push -u origin main`.
4. Verify the Action runs green and the live URL serves the page with working CSS (base path correct).
5. Tick remaining Stage 01 checkbox, update `docs/PROGRESS.md`.

---

## Self-review notes

- Spec coverage: all STAGE_01 checkboxes map to Tasks 1-7 except "self-hosted font" (deliberately Stage 02 per stage file wording "pick during design pass") — stage file lists font under Stage 02, no gap.
- Types consistent: `Base.astro` Props used identically in Tasks 3-4.
- Placeholders: `SITE`/`BASE`/robots sitemap host are deliberate user-deferred values, marked BLOCKED in Task 7 — not plan gaps.
- shadcn CLI prompts may drift; Task 6 Step 1 records expected answers rather than flags for that reason.
