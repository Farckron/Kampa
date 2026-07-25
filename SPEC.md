# SPEC.md — Kampa

Status: v1.0 — design approved 2026-07-25. Market research in
`docs/research/2026-07-25-market-research.md` (read it; positioning and copy
derive from it).

## 1. What Kampa is

Kampa is a free, static, bring-your-own-key (BYOK) AI campaign planner for
small businesses. The user answers 8 structured questions; Kampa generates a
complete 90-day marketing campaign — strategy with channel decisions (and
rejections), a week-by-week calendar, and ready-to-paste copy in the user's
own voice — using the user's Claude API key, entirely in the browser.

**Positioning (from research):** a structured, opinionated campaign *system*,
not a chat box. Wedges: (1) constraint-first planning — budget and hours are
hard inputs; (2) zero-trust architecture — no account, no server, no database,
nothing leaves the browser except the call to `api.anthropic.com`; (3) cost
transparency — software free, ~€1 of API spend per campaign vs €59-69/mo for
Jasper. There is no vertical BYOK tool in SMB marketing; that is the gap.

**Audience:** small businesses doing their own marketing. Site in English;
primary go-to-market focus: Latvia (Latvia-relevant examples and SEO terms).

**Hosting:** GitHub Pages, deploy via GitHub Actions on push to `main`.
Custom domain later — all canonical URLs derive from Astro `site` config so
the switch is a one-line change. Repo is public; the open repo is itself a
trust asset.

## 2. Architecture (approved: option A)

- **Astro 5** static site. All marketing pages are pure Astro components,
  zero client JS.
- **One React 19 island** on `/app` (`client:only="react"`) — the campaign
  wizard.
- **Tailwind CSS v4 + shadcn/ui** (components pulled via shadcn MCP,
  `.mcp.json` with `npx shadcn@latest mcp`).
- **State:** React `useReducer` + context in the island. No zustand, no
  router inside the island.
- **API access:** plain `fetch` to `https://api.anthropic.com/v1/messages`
  with SSE streaming parsed by hand (~40 lines). No Anthropic SDK — smaller
  bundle and every network byte auditable, which is the trust story.
- **No backend, ever.** No analytics vendors, no font CDNs, no tag managers,
  zero third-party scripts.

### 2.1 Site map

```
/            landing (sections in §3)
/app         campaign wizard (React island)
/samples/    3 pre-generated sample plans (demo mode content + SEO pages)
/guide/api-key   illustrated 90-second "get a spend-capped Claude key" guide
/blog/       Astro content collections; SEO engine (seed posts post-launch)
/faq         standalone FAQ page
/privacy     key- and data-handling transparency page
/terms
404
```

Nav: logo · How it works (anchor) · FAQ · Blog · GitHub icon (public repo) ·
primary CTA **"Open the app"**.

### 2.2 Repo layout

```
src/
  pages/            index.astro, app.astro, faq.astro, privacy.astro,
                    terms.astro, 404.astro, samples/, guide/, blog/
  components/
    landing/        Hero, HowItWorks, Features, Comparison, Samples, FAQ,
                    FinalCta, Footer, Nav (.astro)
    app/            wizard React island: Gate, Intake, Generation, Result,
                    CostMeter (.tsx)
    ui/             shadcn components
  lib/
    anthropic.ts    fetch + SSE parser + error mapping
    prompts/        system.ts, stage1-strategy.ts, stage2-calendar.ts,
                    stage3-copy.ts, schemas.ts (JSON schemas)
    cost.ts         pricing table + token→EUR calculator
    exports.ts      markdown, .ics generation; print stylesheet for PDF
    storage.ts      sessionStorage/localStorage wrapper (key, drafts)
  content/          blog/, samples/ (content collections)
  styles/
docs/               PROGRESS.md, research/, specs/
stages/             STAGE_01..07 task files
.github/workflows/  deploy.yml
CLAUDE.md  SPEC.md  .mcp.json
```

### 2.3 Security model (non-negotiable)

- API key is **never** present in the repo, build output, config, tests, or
  commits. It exists only in the user's browser.
- Storage: `sessionStorage` by default; `localStorage` only via explicit
  "remember on this device" checkbox. Visible **Clear key** button in the app
  header at all times.
- The key is sent to exactly one host: `api.anthropic.com`. CSP via
  `<meta http-equiv="Content-Security-Policy">` (GitHub Pages cannot set
  headers): `default-src 'self'; connect-src 'self' https://api.anthropic.com;
  img-src 'self' data:; style-src 'self' 'unsafe-inline'` (tighten during
  implementation as build output allows).
- Key setup guide instructs the user to create a **dedicated, spend-capped**
  key and to rotate it; the app states plainly that the key stays in the
  browser but any compromised site could misuse a key, hence the cap.
- Fonts self-hosted. No external requests of any kind besides the API call.

### 2.4 API usage

- Endpoint: `POST https://api.anthropic.com/v1/messages`, headers
  `content-type: application/json`, `x-api-key: <user key>`,
  `anthropic-version: 2023-06-01`,
  `anthropic-dangerous-direct-browser-access: true`, `stream: true`.
- **Models (user-selectable in Gate screen):**
  - `claude-sonnet-5` — default ("balanced"). $3/$15 per MTok ($2/$10 intro
    through 2026-08-31).
  - `claude-haiku-4-5` — "budget". $1/$5 per MTok.
  - `claude-opus-5` — "best strategy". $5/$25 per MTok.
  Deliberate product decision: the user pays for their own tokens, so the
  cheaper default (Sonnet) is chosen over the usual Opus default; pricing
  table lives in `lib/cost.ts` with source + date comment.
- **Structured output:** stages 1-2 use
  `output_config: {format: {type: "json_schema", schema: ...}}` so responses
  are guaranteed-valid JSON (no parse-retry loops needed; still validate).
  Stage 3 returns markdown text per asset. Do NOT send `temperature`/`top_p`
  (rejected on Sonnet 5) and never use assistant prefill (400).
- **Prompt caching:** shared system prompt + intake context marked with
  `cache_control: {type: "ephemeral"}` so stages 2-3 read stage-1 context at
  ~0.1× price (min cacheable prefix 1024 tokens on Sonnet 5 — pad system
  prompt naturally above that).
- **Cost meter:** read `usage` fields from SSE `message_start` /
  `message_delta` events (`input_tokens`, `output_tokens`,
  `cache_read_input_tokens`, `cache_creation_input_tokens`), multiply by the
  pricing table, display running tokens + EUR. Show a precomputed estimate
  before each stage runs; user confirms.
- **Errors:** map HTTP status to friendly UI messages (401 bad key, 429 rate
  limited with retry-after, 529 overloaded, 400 with `stop_reason: refusal`
  → show explanation). Max 1 automatic retry on 5xx.

## 3. Landing page (approved section by section)

Design language: webglazer.com style — white background, huge black
headline, generous whitespace, thin-bordered white cards, minimal accent
color, modern sans-serif, dashboard-style CSS mockups. All sections pure
Astro.

1. **Hero** — Headline: *"A real marketing plan. For your budget. In 15
   minutes."* Subhead: "Kampa interviews you like a strategist — your
   business, your budget, your hours — then builds a complete 90-day
   campaign: channel plan, weekly calendar, ready-to-paste copy. Free
   software. You pay Anthropic ~€1 per campaign." CTAs: **Start a campaign →**
   (black, → /app) · **See a sample plan** (ghost, → demo mode). Trust line:
   "No signup. No servers. Your data and API key never leave your browser."
   Below: CSS-built mockup of a finished campaign package card. Strip:
   *BUILT FOR SMALL BUSINESSES THAT DO THEIR OWN MARKETING*.
2. **How it works** — 3 numbered cards: (1) Tell Kampa about your business —
   8 quick questions incl. writing samples for voice; (2) Get your campaign —
   channels chosen for your constraints with rejection reasons, budget split,
   weekly calendar, ready-to-paste copy; (3) Export and run it — Markdown,
   PDF, calendar (.ics); the plan is yours. Caption under (2): "You watch
   every cent: a full campaign costs about €1 in Claude API usage."
3. **Feature grid** — 6 cards, 2×3: Plans that fit your constraints ·
   Decisions, not just content · Copy in your voice · Live cost meter ·
   Nothing leaves your browser (open source link) · Own your plan (exports,
   no lock-in).
4. **Comparison** — "Why not just ChatGPT?" table: Kampa vs ChatGPT free vs
   Jasper vs HubSpot Campaign Assistant. Rows: complete 90-day package,
   constraint-aware planning, cost, signup, data on their servers, exports.
   Honest closing paragraph: "You could build this yourself in ChatGPT with
   the right 15 prompts. Kampa is those prompts, in the right order, with
   your constraints enforced and the output packaged. That's the whole
   product — and it's why it's free." (Comparison tables are GEO gold.)
5. **Sample plans** — "See what you get": tabbed viewer, 3 pre-generated
   full plans (coffee shop in Riga · hair salon · e-commerce boutique),
   scrollable styled frame, "Open full sample" links to /samples/*.
6. **FAQ** — accordion, 6 items, JSON-LD `FAQPage` schema: Is it really
   free? · What's a Claude API key and how do I get one? · Is my API key
   safe? (honest: browser-only, spend-capped key, here's the code) · What
   exactly do I get? · Why not just use ChatGPT? · Does it work for my type
   of business?
7. **Final CTA** — dark inverted band: *"Plan your next campaign before your
   coffee gets cold."* + Start a campaign →.
8. **Footer** — logo + one-liner, Pages / Legal columns, GitHub link,
   oversized flat "kampa" wordmark, © 2026.

## 4. Wizard (/app)

Four phases in one island, `useReducer` state machine.

### 4.1 Gate

Two doors: **Try the demo** (loads a pre-generated sample plan into the
Result view — no key required; value before the ask) and **Use my API key**.
Key screen: paste field, "remember on this device" checkbox (localStorage
opt-in; default sessionStorage), link to /guide/api-key, spend-cap reminder,
model selector (Sonnet default · Haiku budget · Opus best). Clear-key button
persists in app header.

### 4.2 Intake

8 questions, one card at a time, progress bar, every answer editable later:

1. What do you sell? (short text)
2. Who buys it? (short text)
3. City / region (text, default hint "e.g. Riga")
4. Monthly marketing budget, EUR (number)
5. Hours per week you can spend (number)
6. Channels you already use (multi-select: Instagram, Facebook, Google
   Business Profile, email, TikTok, LinkedIn, website/SEO, none)
7. Your one goal for the next 90 days (short text)
8. Paste 2-3 samples of your own writing — posts, About page (textarea;
   optional but strongly encouraged for voice)

Intake state auto-saved as draft (same storage tier as the key choice).

### 4.3 Generation — 3 staged calls, streamed

Before each stage: show cost estimate; user clicks "Generate". Streaming
text/JSON renders live; cost meter ticks in the corner.

- **Stage 1 — Strategy** (JSON via output_config): positioning statement,
  ICP summary, 2-3 chosen channels each with a reason, rejected channels
  each with a one-line reason, budget split (sums to the stated budget),
  3 KPIs with target numbers.
- **Stage 2 — Calendar** (JSON): 12 weeks; each item: week number, channel,
  asset type, working title, time estimate in minutes. Constraint: weekly
  time sums must fit the user's hours.
- **Stage 3 — Copy** (markdown per item, batched): ready-to-paste copy for
  each calendar asset, written in the user's sampled voice. Batched by week
  to keep individual responses small.

Shared system prompt (cached): opinionated SME marketing strategist. Hard
rules: budget and hours are constraints, never exceed them; always reject
channels with reasons; concrete numbers over platitudes; no jargon back at
the user; assets in the user's voice; flag items that need a human (photos,
prices, legal claims).

Each stage: JSON schema validated client-side; on invalid → one retry with
error appended; token caps per stage (stage 1 ≈ 2K out, stage 2 ≈ 3K out,
stage 3 ≈ 4K out per batch).

### 4.4 Result

Tabs: **Strategy / Calendar / Copy / Export**. Per-section "Regenerate"
(re-runs only that stage, downstream stages marked stale). Export tab:
- Markdown (single .md, Blob download)
- PDF (print stylesheet + window.print())
- Calendar .ics (hand-rolled generator, ~30 lines: one VEVENT per calendar
  item, dated from a user-chosen start date)

Campaign saved as draft in storage; "Start over" clears it.

## 5. SEO / GEO plan

- Head terms are unwinnable (research §4); target long-tail:
  "marketing plan for a small business with a $500 budget", "jasper ai
  alternative free", "ai marketing tool that doesn't store your data",
  comparison pages. Latvia layer: "mārketinga plāns mazam uzņēmumam" etc.
  as blog topics later (English UI stays).
- Per-page: canonical from `site` config, title/description, OG image
  generated at build (astro-og / satori), sitemap, robots.txt, RSS.
- **llms.txt** + JSON-LD: `SoftwareApplication` (site), `FAQPage` (FAQ),
  `HowTo` (guide page). Q&A-style headers in content — LLMs cite structured
  answer blocks.
- Sample plan pages are real content (full pre-generated plans), not stubs —
  they double as programmatic-SEO seeds; the vertical expansion (30-80
  pages) is post-MVP.
- Performance budget: landing ships ~0 JS; Lighthouse ≥ 95 all categories.

## 6. Testing

- **vitest** for `lib/`: cost calculator (pricing math, all 3 models,
  cache-token handling), exports (md structure, .ics validity), SSE parser
  (event splitting, partial chunks, usage extraction), schema validation,
  storage wrapper (tier switching, clear).
- **Playwright** smoke: wizard happy path with mocked API (route intercept
  on api.anthropic.com), demo mode, key never appears in requests to any
  other host.
- No test bloat: landing pages get no component tests; visual check via dev
  server.

## 7. Deploy

`.github/workflows/deploy.yml`: on push to `main` → `withastro/action`
(build) → `actions/deploy-pages`. Node LTS, npm. No secrets needed (nothing
to hide — that's the point).

## 8. Success criteria (from research §5.5)

- MVP gate: a user with a key completes intake and exports a plan; full
  campaign costs ≤ €1.50 on Sonnet (verify with cost meter).
- Validation gate (post-launch): ≥15% of engaged visitors open the key
  guide; if it fails, pivot ICP to consultants/agencies — not more features.
- Distribution gate: 500 organic visits/month within 90 days of content.

## 9. Explicitly out of scope for v1

Accounts, multi-user, integrations, publishing/scheduling, analytics
dashboards, image generation, general-purpose chat mode, multi-provider
BYOK, Latvian locale UI, programmatic vertical pages (30-80), email capture,
monetization (later: TypingMind-style one-time license — see research §5.4).
