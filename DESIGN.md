# DESIGN.md — Kampa visual scheme (canonical)

Single source of truth for Kampa's visual identity. Every agent working on
this repo MUST follow this file. If a change requires deviating from it,
update this file in the same commit — code and DESIGN.md never disagree.

Implementation lives in `src/styles/global.css` (oklch tokens). Hex values
below are references; the oklch tokens are canonical.

Source material (local, gitignored — values embedded here so this doc is
self-contained): `inspiration/Daria-task/Image/` — brand palette
(`d3f40c1baffb6441da5471cddccdd0e7.jpg`), logo marks (`logo-dark.png`,
`logo-white.png`).

## 1. Logo

"K" letterform with the brand gradient (violet → coral → orange).

- `logo-white.png` — for light/paper backgrounds (default).
- `logo-dark.png` — for dark bands / dark backgrounds.
- Shipped favicon: `public/favicon.svg` (gradient K). Do not redraw the mark,
  recolor it, or place it on mid-tone backgrounds where neither variant clears
  contrast.

## 2. Color

### Core surface & text tokens (implemented)

| Token | Hex ref | Role |
|---|---|---|
| `--paper` | `#faf9f6` | Page background |
| `--paper-dim` | `#f1efe9` | Muted surfaces |
| `--ink` | `#15151b` | Body text, primary buttons |
| `--ink-soft` | `#6c6c6e` | Secondary text |
| `--ink-faint` | `#7c7c7e` | Non-text only |
| `--line` | `#e1e0de` | Decorative hairlines |
| `--input` | `#88888a` | Field borders — must keep ≥3:1 (WCAG 1.4.11) |
| `--dark` | `#111116` | Dark band background |

### Brand accents (implemented)

| Token | Hex ref | Text-safe twin |
|---|---|---|
| `--violet` | `#7c4dff` | `--violet-ink` `#5f35e0` |
| `--coral` | `#e0637f` | `--coral-ink` `#a63a55` |
| `--orange` | `#fb8a3c` | `--orange-ink` `#a34e18` |

Rules:
- Accent-colored TEXT always uses the `-ink` twin, never the base accent.
- The gradient (`--grad`: violet 0% → coral 55% → orange 100%, 100deg) is the
  brand signature. White text sits only on `--grad-strong`.
- Tints/washes via the existing `--*-tint` / `--*-wash` tokens, not new
  ad-hoc alphas.

### Extended brand ramps (from palette source)

Use for illustration, charts, decorative fills — NOT for text and NOT as new
UI accents without updating this file.

- Orange ramp: `#F56A00` `#FA8B01` `#FFAD03` `#FFC243` `#FFCF70`
- Purple ramp: `#CEA7EE` `#B67BE6` `#9D4EDD` `#72369D` `#461E5C`

`#461E5C` and `#72369D` are the only ramp values dark enough for text on
paper; everything else in the ramps is decorative-only.

## 3. Typography (self-hosted, no font CDNs)

| Role | Family | Token |
|---|---|---|
| Display / headlines | Space Grotesk | `--font-display` |
| Body / UI | Inter | `--font-sans` |
| Code, numbers, cost meter | IBM Plex Mono | `--font-mono` |

Huge black headlines on paper; generous whitespace; remove decoration when
in doubt (webglazer.com target).

## 4. Layout

- Content wrap: 1180px. Radius base: 14px (`--radius`). Pill radius for CTAs.
- Thin-bordered cards (`--line`), white card surfaces on paper.
- Dark bands (`--dark`) for contrast sections; text there uses
  `--dark-ink-soft`, hairlines `--dark-line`.

## 5. Non-negotiables

- WCAG AA minimum everywhere; the token comments in `global.css` carry the
  measured ratios — keep them updated.
- No new colors, fonts, or shadows outside this file's tokens.
- Landing pages: zero client JS (see CLAUDE.md Tier 1).
