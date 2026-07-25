import { describe, expect, it } from "vitest";
import { costEur, USAGE } from "@/components/app/mock";

describe("mock cost", () => {
  it("prices tokens off the model table", () => {
    // sonnet is €3 in / €15 out per million
    expect(costEur("claude-sonnet-5", 1_000_000, 1_000_000)).toBe(18);
    expect(costEur("claude-haiku-4-5", 1_000_000, 1_000_000)).toBe(6);
  });

  it("keeps a full campaign near the €0.80 the UI advertises", () => {
    const total =
      costEur("claude-sonnet-5", 12000, 7500) +
      costEur("claude-sonnet-5", 18000, 9700) +
      costEur("claude-sonnet-5", 30000, 24000);
    expect(total).toBeCloseTo(0.8, 1);
  });

  it("the per-stage estimate tracks the selected model", () => {
    const { tokensIn, tokensOut } = USAGE.strategy;
    const sonnet = costEur("claude-sonnet-5", tokensIn, tokensOut);
    const opus = costEur("claude-opus-5", tokensIn, tokensOut);
    expect(opus).toBeGreaterThan(sonnet);
    expect(opus.toFixed(2)).not.toBe(sonnet.toFixed(2));
  });
});
