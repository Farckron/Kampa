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
import { buildStrategyPrompt } from "@/lib/prompts/stage1-strategy";
import { buildCalendarPrompt } from "@/lib/prompts/stage2-calendar";
import { buildCopyPrompt, COPY_BATCHES } from "@/lib/prompts/stage3-copy";

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
    expect(built.userText).toContain("600");
    expect(built.userText).toContain(intake.sell);
    expect(built.userText).toContain("240 minutes per week");
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
    expect(built.userText).toContain("Google Business Profile");
    expect(built.userText).toContain("240 minutes or less");
    expect(built.userText).toContain(strategy.positioning);
  });

  it("returns the calendar schema and its token budget", () => {
    expect(built.schema).toBe(CALENDAR_SCHEMA);
    expect(built.maxTokens).toBe(4000);
  });
});

describe("buildCopyPrompt", () => {
  it("includes only the requested weeks' calendar items", () => {
    const built = buildCopyPrompt(intake, strategy, calendar, [5, 6, 7, 8]);
    expect(built.userText).toContain("Week 5:");
    expect(built.userText).toContain("Week 8:");
    expect(built.userText).not.toContain("Week 4:");
    expect(built.userText).not.toContain("Week 9:");
    expect(built.userText).toContain("for these 4 items");
    expect(built.schema).toBe(COPY_SCHEMA);
    expect(built.maxTokens).toBe(5000);
  });

  it("passes the voice samples through", () => {
    const built = buildCopyPrompt(intake, strategy, calendar, [1]);
    expect(built.userText).toContain(intake.voiceSamples);
  });

  it("batches all 12 weeks exactly once", () => {
    expect(COPY_BATCHES.flat()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});
