import { describe, expect, it } from "vitest";
import { demoCampaign } from "@/components/app/demo-campaign";

describe("demoCampaign", () => {
  const { strategy, calendar, copy } = demoCampaign;

  it("budget split sums to the sample's €400", () => {
    expect(strategy!.budgetSplit.reduce((n, b) => n + b.eur, 0)).toBe(400);
  });

  it("no week exceeds the 4 h/week budget", () => {
    const perWeek = new Map<number, number>();
    for (const i of calendar!)
      perWeek.set(i.week, (perWeek.get(i.week) ?? 0) + i.minutes);
    expect(calendar).toHaveLength(12);
    expect(Math.max(...perWeek.values())).toBeLessThanOrEqual(240);
  });

  it("copy weeks and channels exist in the calendar", () => {
    for (const c of copy!) {
      expect(
        calendar!.some((i) => i.week === c.week && i.channel === c.channel),
      ).toBe(true);
    }
    expect(
      copy!.filter((c) => c.channel === "Instagram").length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      copy!.filter((c) => c.channel === "Email").length,
    ).toBeGreaterThanOrEqual(1);
  });
});
