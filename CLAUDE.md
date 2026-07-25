# CLAUDE.md — Kampa

Free static BYOK AI campaign planner for small businesses. Astro landing +
one React wizard island. Full architecture in SPEC.md — read it completely
before writing any code. Market context in
`docs/research/2026-07-25-market-research.md`.

## TIER 1 — HARD RULES (non-negotiable, check before every action)

1. **No backend, no server code, ever.** Static output only. The only
   network call the shipped site may make is `POST
   https://api.anthropic.com/v1/messages` from the wizard. No analytics
   vendors, no font CDNs, no tag managers, no third-party scripts of any
   kind. CSP `connect-src` stays limited to `'self' https://api.anthropic.com`.
2. **API keys never touch the repo.** No real key in code, config, tests,
   fixtures, commits, or docs — not even "temporarily". Tests use fake keys
   (`sk-ant-test-...`). If a key is ever committed, stop and tell the user to
   revoke it immediately.
3. **Dependency fence.** Runtime dependencies allowed: astro, react,
   react-dom, tailwindcss, shadcn/ui components (and their direct radix
   deps), @astrojs/* official integrations. Dev-only: vitest, playwright,
   typescript, prettier. No Anthropic SDK (plain fetch — auditability is the
   product). Do not add any other dependency without asking.
4. **Landing pages ship zero client JS.** Marketing pages are pure Astro.
   Interactivity beyond the /app island needs CSS or a written justification.
5. **Never speculate about unread code.** Read files before claiming what
   they do.
6. **Do not start a stage other than the one requested.** Finish the stage,
   report, stop. Stage files live in `stages/`.

## TIER 2 — WORKFLOW

### Per-task loop
For every task in a stage file:
1. For `lib/` code: write/extend vitest tests first, then implement until
   green. For UI: implement, then verify in dev server (and Playwright where
   the stage says so).
2. Run the full check: `npm run test && npm run build` (build must pass —
   it is the deploy gate).
3. Commit (see commit rules).
4. Tick the task checkbox in the stage file and append one line to
   docs/PROGRESS.md (date, stage, task, commit hash, one-sentence note).

### Commit rules
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`.
- One logical change per commit. Never commit a broken build to main.

### Design rules
- Visual target: webglazer.com — white, huge black headline, thin-bordered
  cards, generous whitespace, one accent color. When in doubt, remove
  decoration.
- Copy voice: direct, benefit-first, honest (see SPEC §3 approved copy —
  do not rewrite approved copy without asking).
- shadcn components via the shadcn MCP server; keep them in `src/components/ui/`.

### API rules (wizard)
- Model IDs, pricing, and request shape are pinned in SPEC §2.4. Structured
  output via `output_config.format` json_schema for stages 1-2. No
  `temperature`/`top_p`, no assistant prefill (both 400 on Sonnet 5).
- Cost meter figures come from real `usage` fields, never estimated after
  the fact; the pre-stage estimate is labeled as an estimate.
- Every user-facing API error must be actionable (bad key → link to guide,
  rate limit → wait time, overloaded → try again).
