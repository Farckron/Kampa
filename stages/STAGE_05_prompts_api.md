# STAGE 05 — Prompts + API + cost meter (the product)

Goal: real campaigns generated with a real key.

- [ ] `anthropic.ts`: fetch wrapper — headers per SPEC §2.4, SSE parser
      (event splitting across chunks, text deltas, usage extraction from
      message_start/message_delta, stop_reason/refusal handling), error
      mapping (401/429/529/400→UI messages); vitest with recorded SSE
      fixtures
- [ ] `cost.ts`: pricing table (3 models, input/output/cache rates, dated
      source comment), token→EUR, pre-stage estimators; vitest
- [ ] `prompts/system.ts`: strategist system prompt (SPEC §4.3 hard rules),
      >1024 tokens for cacheability, `cache_control` on system + intake
- [ ] `prompts/schemas.ts`: JSON schemas for stage 1 (strategy) and stage 2
      (calendar) — additionalProperties:false, required fields per SPEC
- [ ] `prompts/stage1-strategy.ts` / `stage2-calendar.ts` /
      `stage3-copy.ts`: prompt builders taking intake + prior stage JSON;
      stage 3 batched by week
- [ ] Client-side schema validation + single retry with error feedback
- [ ] Wire Generation.tsx to real calls: streaming render, cost meter on
      real usage numbers, per-stage confirm with estimate
- [ ] Constraint checks in UI: budget split sums, weekly minutes vs user
      hours — flag violations, offer regenerate
- [ ] Regenerate per stage with downstream-stale marking
- [ ] Prompt quality pass: run ≥3 real personas (use own key), iterate
      prompts until output would genuinely be worth €1 — this is the
      product; budget real time here
- [ ] Playwright: happy path with intercepted/mocked api.anthropic.com;
      assert no request ever leaves to any other host

Done when: real key produces a complete, constraint-respecting campaign for
all 3 test personas at ≤ €1.50 on Sonnet.
