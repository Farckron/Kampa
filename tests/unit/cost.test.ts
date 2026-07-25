import { describe, expect, it } from "vitest";
import {
  CACHE_READ_FACTOR,
  CACHE_WRITE_FACTOR,
  PRICES,
  STAGE_ESTIMATES,
  estimateEur,
  fmtEur,
  usageToEur,
} from "@/lib/cost";

const NO_CACHE = { cacheReadTokens: 0, cacheWriteTokens: 0 };

describe("PRICES", () => {
  it("has list pricing for the three models (sonnet at 3/15, not intro 2/10)", () => {
    expect(PRICES).toEqual({
      "claude-sonnet-5": { inPerMTok: 3, outPerMTok: 15 },
      "claude-haiku-4-5": { inPerMTok: 1, outPerMTok: 5 },
      "claude-opus-5": { inPerMTok: 5, outPerMTok: 25 },
    });
  });

  it("uses the documented cache factors", () => {
    expect(CACHE_READ_FACTOR).toBe(0.1);
    expect(CACHE_WRITE_FACTOR).toBe(1.25);
  });
});

describe("usageToEur", () => {
  // 100k in + 10k out, no cache.
  it("bills sonnet at 3/15", () => {
    expect(
      usageToEur("claude-sonnet-5", {
        inputTokens: 100_000,
        outputTokens: 10_000,
        ...NO_CACHE,
      }),
    ).toBeCloseTo(0.45, 10);
  });

  it("bills haiku at 1/5", () => {
    expect(
      usageToEur("claude-haiku-4-5", {
        inputTokens: 100_000,
        outputTokens: 10_000,
        ...NO_CACHE,
      }),
    ).toBeCloseTo(0.15, 10);
  });

  it("bills opus at 5/25", () => {
    expect(
      usageToEur("claude-opus-5", {
        inputTokens: 100_000,
        outputTokens: 10_000,
        ...NO_CACHE,
      }),
    ).toBeCloseTo(0.75, 10);
  });

  it("applies 0.1x on cache reads and 1.25x on cache writes", () => {
    // 1M cache read + 1M cache write on sonnet: 3*0.1 + 3*1.25 = 4.05
    expect(
      usageToEur("claude-sonnet-5", {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 1_000_000,
        cacheWriteTokens: 1_000_000,
      }),
    ).toBeCloseTo(4.05, 10);
  });

  it("throws on an unknown model", () => {
    expect(() =>
      usageToEur("gpt-nope", { inputTokens: 1, outputTokens: 1, ...NO_CACHE }),
    ).toThrow(/unknown model/);
  });
});

describe("estimateEur", () => {
  it("estimates the strategy stage on sonnet", () => {
    // 6000 * 3 + 1500 * 15 = 40500 -> 0.0405
    expect(estimateEur("claude-sonnet-5", "strategy")).toBeCloseTo(0.0405, 6);
  });

  it("estimates every stage on every model without cache credit", () => {
    for (const model of Object.keys(PRICES)) {
      for (const [stage, e] of Object.entries(STAGE_ESTIMATES)) {
        expect(estimateEur(model, stage)).toBeCloseTo(
          usageToEur(model, {
            inputTokens: e.tokensIn,
            outputTokens: e.tokensOut,
            ...NO_CACHE,
          }),
          10,
        );
      }
    }
  });

  it("throws on an unknown model or stage", () => {
    expect(() => estimateEur("gpt-nope", "strategy")).toThrow(/unknown model/);
    expect(() => estimateEur("claude-sonnet-5", "nope")).toThrow(
      /unknown stage/,
    );
  });
});

describe("fmtEur", () => {
  it("always renders two decimals", () => {
    expect(fmtEur(0)).toBe("€0.00");
    expect(fmtEur(0.1)).toBe("€0.10");
    expect(fmtEur(1)).toBe("€1.00");
    expect(fmtEur(12.3)).toBe("€12.30");
  });

  it("rounds to the nearest cent", () => {
    expect(fmtEur(0.0405)).toBe("€0.04");
    expect(fmtEur(0.126)).toBe("€0.13");
    expect(fmtEur(0.135)).toBe("€0.14");
  });
});
