# STAGE 04 — Wizard UI (no API yet)

Goal: /app island fully navigable with mocked generation.

- [ ] `app.astro` page hosting the island `client:only="react"`
- [ ] Reducer + context: state machine phases gate → intake → generation →
      result; typed actions; unit tests for reducer transitions
- [ ] `storage.ts`: tiered wrapper (sessionStorage default, localStorage
      opt-in), key + draft persistence, clear-all; vitest
- [ ] `Gate.tsx`: demo door, key door (paste field, remember checkbox,
      model selector, guide link, spend-cap note); key format sanity check
      (`sk-ant-` prefix) — validation happens on first real call
- [ ] App header: Kampa logo, model badge, Clear key button
- [ ] `Intake.tsx`: 8 question cards (SPEC §4.2), progress bar, back/edit,
      draft autosave
- [ ] `Generation.tsx`: stage list with per-stage estimate + Generate
      button, streaming placeholder area (fed by mock)
- [ ] `Result.tsx`: tabs Strategy/Calendar/Copy/Export rendering mock data;
      regenerate buttons (wired to mock)
- [ ] `CostMeter.tsx`: corner widget, tokens + EUR, fed by mock events
- [ ] Demo mode: loads sample plan JSON into Result
- [ ] shadcn components as needed (button, input, textarea, select, tabs,
      checkbox, progress, card)

Done when: full wizard clickable end-to-end against mock data; demo mode
works on the deployed site.
