# Security self-review

Date: 2026-07-25. Commit: stage-07-launch, pre-launch gate.
Reviewer: automated grep over `src/` plus static inspection of a fresh `dist/`.
Scope: the five claims the site makes in public (privacy page, FAQ, README):
browser-only, no server, key never leaves the device except to
`api.anthropic.com`, nothing stored off-device, no third-party requests.

This is a self-review, not a third-party audit. It verifies that the shipped
code matches the claims. It does not model an attacker with local device
access, and it does not audit Anthropic's API.

## Method

Every check below is a command anyone can re-run from the repo root. `dist/`
checks were run against a clean `npm run build` (17 HTML pages + `rss.xml`).

1. `grep -rnE '\b(fetch|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon|axios)\b' src/`
2. `grep -rnoE 'https?://[a-zA-Z0-9._/-]+' src/`
3. `grep -rn 'localStorage\|sessionStorage\|indexedDB\|document\.cookie' src/`
4. `grep -rn 'console\.' src/`
5. `grep -rn 'apiKey\|api_key\|x-api-key' src/`
6. Parse of every `dist/**/*.html` for the CSP `<meta>`, compared to the SPEC
   §2.3 string directive by directive.
7. Parse of every `dist/**/*.html` for loaded subresources (`<script src>`,
   `<img src>`, `<link rel=stylesheet|preload|icon|manifest|modulepreload>`)
   and for any absolute URL inside inline `<script>` bodies.

## Results

### 1. Network targets: pass

One `fetch` call exists in the entire source tree, `src/lib/anthropic.ts:145`,
and its target is the module constant
`ENDPOINT = "https://api.anthropic.com/v1/messages"`. There is no
`XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon` or HTTP client
dependency anywhere in `src/`. The two other matches for the grep are comments.

The remaining absolute URLs in `src/` are all inert: `schema.org` and
`www.w3.org/2000/svg` are XML/JSON-LD namespace identifiers (never fetched),
and `github.com/Farckron/Kampa`, `console.anthropic.com`,
`www.anthropic.com/pricing`, `www.anthropic.com/legal/privacy`,
`docs.github.com/...`, `www.jasper.ai` are anchor hrefs the user clicks.

No analytics, no error reporting, no font CDN, no telemetry of any kind.

### 2. Key handling: pass

`src/components/app/storage.ts` is the only module that touches Web Storage.
The key's full lifecycle:

- written: `storage.setKey()`, called once, from `Gate.tsx:34`
- cleared: `storage.clearKey()`, from `Wizard.tsx:47` and `Wizard.tsx:94`
- read: `storage.getKey()`, from `Wizard.tsx:120` (presence check only) and
  `engine.ts:156` (the single read of the value)

From `engine.ts:156` the key lives in a local `apiKey`, is passed through
`generate()` into `streamMessage()`, and lands in exactly one place: the
`x-api-key` request header (`anthropic.ts:149`). It is never interpolated into
a URL, never added to a prompt, never placed in an `Error` message, never put
into React state or the reducer, and never written to a file export.

`Gate.tsx:80` also contains `setKey(...)`, which is a local `useState` setter
for the input field, not the storage function. Noted here because a naive grep
for `setKey(` finds it.

`ApiError` was checked case by case: all 15 construction sites (10 in
`anthropic.ts`, 5 in `engine.ts`) pass a `userMessage` that is static
prose or interpolate a retry count, a truncated validator message, or a
truncated server-supplied `error.message`. None can reach the key.

### 3. Console logging: pass, with one residual noted

There is exactly one `console.*` call in application code:

`src/components/app/engine.ts:117`:
`console.debug("[kampa] stage output failed validation:", detail, text)`

Traced both arguments:

- `text` is the accumulated `text_delta` content from the SSE stream, i.e.
  model output only. The response body never echoes request headers, so the
  key cannot enter it from the transport side.
- `detail` is `e.message` from `JSON.parse` or from the `validate*` functions
  in `src/lib/prompts/schemas.ts`, all of which derive from `text`.

The key is never part of any prompt, so the model has nothing to echo. The
comment on `engine.ts:116` states this and it holds.

Residual, accepted: if a user pasted their API key into a free-text intake
field (business description, offer, and so on), that text becomes prompt input
and could in principle be reflected in model output and then into this debug
log. This requires the user to type their secret into the wrong box. Not
mitigated in code. The debug line is `console.debug`, off by default in most
browsers' console filter, and stays local to the device either way.

### 4. Storage writes: pass

No `indexedDB`, no `document.cookie` anywhere in `src/`. The only Web Storage
access outside `storage.ts` is prose: `Faq.astro:29` and `privacy.astro:38-39`
describe the behaviour to users. Both descriptions match the code, including
the detail that the draft follows the key's tier (`storage.ts:47-53`), so a
remembered key means a remembered draft and a session key means a session
draft. Only two keys are ever written, `kampa.key` and `kampa.draft`, and
`clearAll()` removes both.

Test files touch storage directly; that is test setup, not shipped code.

### 5. CSP meta in dist: pass

All 17 built HTML pages carry an identical `<meta http-equiv="content-security-policy">`.
Its non-hash directives are byte-identical to the SPEC §2.3 string:

`default-src 'self'; connect-src 'self' https://api.anthropic.com; img-src 'self' data:; base-uri 'self'; form-action 'self'; object-src 'none'`

`script-src 'self'` plus per-page sha256 hashes and the `style-src` pair are
generated by Astro from the actual inline content, as configured in
`astro.config.mjs`. `connect-src` allows exactly one external origin, which is
the enforcement that backs the claim in §1: even a supply-chain compromise of a
build dependency could not exfiltrate the key to another host from a page
served with this header.

### 6. External resources in dist: pass

Zero non-self subresources across all 17 pages. The complete loaded set is
three same-origin files:

- `/Kampa/favicon.svg`
- `/Kampa/fonts/schibsted-grotesk-latin-variable.woff2` (self-hosted, no
  Google Fonts)
- `/Kampa/_astro/Base.<hash>.css`

Absolute URLs inside inline `<script>` bodies are the JSON-LD `@context`
(`https://schema.org`) and self-origin canonical values. The absolute
`farckron.github.io` URLs elsewhere in the HTML are `rel="canonical"`,
`og:url` and `og:image` metadata, which are not fetched as subresources by the
page itself.

`tests/e2e/tier1.spec.ts` enforces both halves of this at runtime, asserting
that landing pages ship no executable `<script>` and issue zero cross-origin
requests. Stage 07 extended its `PAGES` list to cover `blog` and a blog post.

## Findings

Zero security defects found. Nothing required a code fix.

One residual risk accepted and documented (§3: a user pasting their key into a
free-text intake field). One non-security gap was found during the same pass
and fixed: `src/pages/404.astro` was not passing `noindex` to `Base.astro`,
which is an SEO issue rather than a security one.

## What this review does not cover

- Anthropic's handling of the key once it reaches their API.
- The user's own device: a browser extension, a shared machine, or malware can
  read `localStorage`. This is why the default is `sessionStorage` and why the
  site tells users to create a dedicated key with a spend cap.
- GitHub Pages transport. HTTPS is enforced by the host, not by this repo.
- The dependency tree itself. `npm audit` is not part of this review, and the
  CSP is the compensating control.
