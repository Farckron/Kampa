# Kampa

**Free AI campaign planner for small businesses.** Answer 8 questions, get a
complete 30-day marketing campaign — strategy with channel decisions (and
rejections), a week-by-week calendar, and ready-to-paste copy in your own
voice. Runs entirely in your browser with your own Claude API key.

**Live: [farckron.github.io/Kampa](https://farckron.github.io/Kampa/)**

## Why it's free

There is no server to pay for. Kampa is static files; the AI runs on your own
Anthropic account. A full campaign costs about €1 in API usage (typically
less on the default model) — versus €59-69/month for the usual tools.

## The trust model (why this repo is public)

Your API key and business data never leave your browser:

- **No backend.** The site is static files on GitHub Pages. There is no
  database, no account system, no analytics, no tracking, no third-party
  scripts, and no server that could ever see your key.
- **One network destination.** The only host the app contacts is
  `api.anthropic.com`, enforced by a Content-Security-Policy
  (`connect-src 'self' https://api.anthropic.com`) baked into every page.
- **Plain `fetch`, no SDK.** The entire API client is
  [`src/lib/anthropic.ts`](src/lib/anthropic.ts) — a few hundred readable
  lines. Every byte that goes over the wire is auditable.
- **Your key, your rules.** Stored in `sessionStorage` by default (gone when
  the tab closes); `localStorage` only if you tick "remember on this device";
  a Clear key button is always in the header. Create a
  [dedicated, spend-capped key](https://farckron.github.io/Kampa/guide/api-key)
  anyway — that advice applies to every bring-your-own-key tool, including
  this one.
- **Tests enforce it.** Playwright specs assert the landing pages ship zero
  executable JavaScript and that no request ever leaves to any host other
  than the site origin and `api.anthropic.com`.

## How it works

1. **Demo first** — see a finished campaign for a Riga coffee shop without a
   key: [try the demo](https://farckron.github.io/Kampa/app?demo=1).
2. **Intake** — 8 questions: what you sell, who buys, region, monthly budget,
   weekly hours, current channels, your 30-day goal, samples of your writing.
3. **Three generation stages**, each streamed live with a running cost meter:
   strategy (channels chosen *and rejected*, budget split, KPIs) →
   4-week calendar (fits your stated hours) → copy for every planned asset.
4. **Export** — Markdown, print-to-PDF, or `.ics` straight into your
   calendar. The plan is a file you own.

Budget and hours are hard constraints, not suggestions: the plan must spend
your stated budget and fit your stated hours, and the app checks both.

## Stack

Astro 7 (static, zero-JS landing pages) · one React 19 island for the wizard
· Tailwind v4 + shadcn/ui · vitest + Playwright · GitHub Actions → Pages.

## Develop

```bash
npm ci
npm run dev        # http://localhost:4321
npm run test       # unit
npm run test:e2e   # playwright (builds + previews on :4322)
npm run typecheck
npm run build
```

## License

[MIT](LICENSE)
