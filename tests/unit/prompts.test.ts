import { describe, expect, it } from "vitest";
import type {
  CalendarItem,
  CopyAsset,
  Intake,
  Strategy,
} from "@/components/app/types";
import {
  CALENDAR_SCHEMA,
  COPY_SCHEMA,
  STRATEGY_SCHEMA,
  validateCalendar,
  validateCopy,
  validateStrategy,
} from "@/lib/prompts/schemas";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import {
  budget90,
  buildStrategyPrompt,
  type BuiltPrompt,
} from "@/lib/prompts/stage1-strategy";
import { buildCalendarPrompt } from "@/lib/prompts/stage2-calendar";
import { buildCopyPrompt, COPY_BATCHES } from "@/lib/prompts/stage3-copy";

/** The whole user message, as the model reads it. */
const userText = (p: BuiltPrompt) => p.blocks.map((b) => b.text).join("\n\n");

const intake: Intake = {
  sell: "Bike repairs and second-hand bikes",
  buyer: "Commuters in the old town",
  region: "Tartu, Estonia",
  budget: 600,
  hours: 4,
  channels: ["Instagram", "Facebook", "TikTok"],
  goal: "20 more repair jobs a month by December",
  voiceSamples: "Bike's ready. Chain was toast, so I swapped it. 40 euros.",
};

// Compile-time check: a literal typed as Strategy must survive the validator,
// so schema, validator and types.ts cannot drift apart silently.
const strategy: Strategy = {
  positioning: "The repair shop that fixes your commuter bike the same day.",
  icp: "25-45, cycles to work daily, panics when the chain snaps on a Monday.",
  chosen: [
    { channel: "Instagram", reason: "Visual work, 2 posts a week at 25 min." },
    { channel: "Google Business Profile", reason: "Free, 90 searches/month." },
  ],
  rejected: [
    { channel: "TikTok", reason: "4h/week you do not have." },
    { channel: "Paid search", reason: "600 EUR buys ~40 clicks here." },
    { channel: "Podcast", reason: "8 hours per episode before editing." },
  ],
  budgetSplit: [
    { item: "Boosted local posts", eur: 400 },
    { item: "Held back for weeks 9-12", eur: 200 },
  ],
  kpis: [
    { name: "Repair jobs", target: "20/month by week 12", where: "Till book" },
    { name: "Profile views", target: "300/month", where: "GBP dashboard" },
    { name: "DMs", target: "10/week", where: "Instagram inbox" },
  ],
};

const calendar: CalendarItem[] = Array.from({ length: 12 }, (_, i) => ({
  week: i + 1,
  channel: "Instagram",
  assetType: "Reel",
  title: `Week ${i + 1}: fixing a snapped cable at the workbench`,
  minutes: 45,
}));

describe("SYSTEM_PROMPT", () => {
  it("is long enough to be worth caching", () => {
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(4500);
  });

  it("states the hard rules the product depends on", () => {
    expect(SYSTEM_PROMPT).toContain("[NEEDS YOU:");
    expect(SYSTEM_PROMPT).toContain("EUR");
    expect(SYSTEM_PROMPT).toMatch(/2-3 channels|TWO OR THREE CHANNELS/);
  });
});

describe("validators accept valid data", () => {
  it("round-trips a Strategy literal", () => {
    expect(validateStrategy(strategy)).toEqual(strategy);
  });

  it("round-trips calendar items", () => {
    expect(validateCalendar({ items: calendar })).toEqual(calendar);
  });

  it("round-trips copy assets", () => {
    const assets: CopyAsset[] = [
      { week: 1, channel: "Instagram", title: "Cable fix", body: "Chain was toast." },
    ];
    expect(validateCopy({ assets })).toEqual(assets);
  });
});

describe("validators reject bad data", () => {
  it("rejects a missing field", () => {
    const { icp: _icp, ...noIcp } = strategy;
    expect(() => validateStrategy(noIcp)).toThrow(/strategy\.icp/);
  });

  it("rejects a wrong type", () => {
    expect(() =>
      validateStrategy({ ...strategy, budgetSplit: [{ item: "Ads", eur: "400" }] }),
    ).toThrow(/eur.*expected a number/);
  });

  it("rejects one chosen channel", () => {
    expect(() =>
      validateStrategy({ ...strategy, chosen: [strategy.chosen[0]] }),
    ).toThrow(/chosen.*at least 2/);
  });

  it("rejects fewer than 3 kpis", () => {
    expect(() =>
      validateStrategy({ ...strategy, kpis: strategy.kpis.slice(0, 2) }),
    ).toThrow(/kpis/);
  });

  it("rejects week 13", () => {
    const items = [...calendar.slice(0, 11), { ...calendar[0]!, week: 13 }];
    expect(() => validateCalendar({ items })).toThrow(/week.*1-12.*13/);
    expect(() =>
      validateCopy({
        assets: [{ week: 13, channel: "Email", title: "t", body: "b" }],
      }),
    ).toThrow(/week.*1-12.*13/);
  });

  it("rejects a short calendar", () => {
    expect(() => validateCalendar({ items: calendar.slice(0, 5) })).toThrow(
      /at least 12/,
    );
  });

  it("rejects non-objects", () => {
    expect(() => validateStrategy(null)).toThrow(/expected an object/);
    expect(() => validateCalendar({ items: "nope" })).toThrow(
      /expected an array/,
    );
  });
});

describe("buildStrategyPrompt", () => {
  const built = buildStrategyPrompt(intake);

  it("embeds the intake, including the budget number", () => {
    expect(userText(built)).toContain("600");
    expect(userText(built)).toContain(intake.sell);
    expect(userText(built)).toContain("240 minutes per week");
  });

  it("asks for the 90-day pot, not the monthly figure", () => {
    expect(budget90(intake)).toBe(1800);
    expect(userText(built)).toContain(
      "1800 EUR total for the 90 days (600 EUR per month)",
    );
    expect(userText(built)).toContain("sum EXACTLY to 1800 EUR");
  });

  it("returns the strategy schema and its token budget", () => {
    expect(built.schema).toBe(STRATEGY_SCHEMA);
    expect(built.maxTokens).toBe(3000);
    expect(built.system).toBe(SYSTEM_PROMPT);
  });
});

describe("buildCalendarPrompt", () => {
  const built = buildCalendarPrompt(intake, strategy);

  it("carries the chosen channels and the weekly minute ceiling", () => {
    expect(userText(built)).toContain("Google Business Profile");
    expect(userText(built)).toContain("240 minutes or less");
    expect(userText(built)).toContain(strategy.positioning);
  });

  it("returns the calendar schema and its token budget", () => {
    expect(built.schema).toBe(CALENDAR_SCHEMA);
    expect(built.maxTokens).toBe(4000);
  });
});

describe("buildCopyPrompt", () => {
  it("includes only the requested weeks' calendar items", () => {
    const built = buildCopyPrompt(intake, strategy, calendar, [5, 6, 7, 8]);
    expect(userText(built)).toContain("Week 5:");
    expect(userText(built)).toContain("Week 8:");
    expect(userText(built)).not.toContain("Week 4:");
    expect(userText(built)).not.toContain("Week 9:");
    expect(userText(built)).toContain("for these 4 items");
    expect(built.schema).toBe(COPY_SCHEMA);
    expect(built.maxTokens).toBe(5000);
  });

  it("passes the voice samples through", () => {
    const built = buildCopyPrompt(intake, strategy, calendar, [1]);
    expect(userText(built)).toContain(intake.voiceSamples);
  });

  it("batches all 12 weeks exactly once", () => {
    expect(COPY_BATCHES.flat()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});

describe("cache breakpoints", () => {
  const s1 = buildStrategyPrompt(intake);
  const s2 = buildCalendarPrompt(intake, strategy);
  const s3 = COPY_BATCHES.map((w) => buildCopyPrompt(intake, strategy, calendar, w));

  it("marks intake and strategy, never the task block", () => {
    expect(s1.blocks.map((b) => b.cache ?? false)).toEqual([true, false]);
    expect(s2.blocks.map((b) => b.cache ?? false)).toEqual([true, true, false]);
    for (const p of s3)
      expect(p.blocks.map((b) => b.cache ?? false)).toEqual([true, true, false]);
  });

  it("keeps the cached prefix byte-identical across all five calls", () => {
    const intakes = [s1, s2, ...s3].map((p) => p.blocks[0]!.text);
    expect(intakes[0]).toContain("Here is the business.");
    expect(new Set(intakes).size).toBe(1);

    const strategies = [s2, ...s3].map((p) => p.blocks[1]!.text);
    expect(new Set(strategies).size).toBe(1);
  });
});
