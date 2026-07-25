import { describe, expect, it } from "vitest";
import { costEur } from "@/components/app/mock";

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
});
