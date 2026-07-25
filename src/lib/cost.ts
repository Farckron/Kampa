import { MODELS } from "@/components/app/types";

export interface Pricing {
  inPerMTok: number;
  outPerMTok: number;
}

/**
 * Source: "Anthropic pricing via claude-api docs", checked 2026-07-25.
 * claude-sonnet-5 $3/$15, claude-haiku-4-5 $1/$5, claude-opus-5 $5/$25 per MTok.
 * Note: sonnet-5 has intro pricing of 2/10 through 2026-08-31 — NOT used here;
 * we bill at list (3/15) so the estimate never goes up on the user by surprise.
 * ponytail: derived from MODELS (same numbers, one source of truth) instead of
 * a second literal table that can drift.
 */
export const PRICES: Record<string, Pricing> = Object.fromEntries(
  MODELS.map((m) => [m.id, { inPerMTok: m.inPerMTok, outPerMTok: m.outPerMTok }]),
);

export const CACHE_READ_FACTOR = 0.1;
export const CACHE_WRITE_FACTOR = 1.25;

function priceOf(model: string): Pricing {
  const p = PRICES[model];
  if (!p) throw new Error(`unknown model: ${model}`);
  return p;
}

// USD prices are treated as EUR 1:1 on purpose: conservative, and FX noise is
// well inside the pricing headroom we already keep.
export function usageToEur(
  model: string,
  u: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  },
): number {
  const { inPerMTok, outPerMTok } = priceOf(model);
  return (
    (u.inputTokens * inPerMTok +
      u.cacheReadTokens * inPerMTok * CACHE_READ_FACTOR +
      u.cacheWriteTokens * inPerMTok * CACHE_WRITE_FACTOR +
      u.outputTokens * outPerMTok) /
    1e6
  );
}

export const STAGE_ESTIMATES: Record<string, { tokensIn: number; tokensOut: number }> = {
  strategy: { tokensIn: 6000, tokensOut: 1500 },
  calendar: { tokensIn: 9000, tokensOut: 2500 },
  copy: { tokensIn: 14000, tokensOut: 4500 },
};

export function estimateEur(model: string, stage: string): number {
  const e = STAGE_ESTIMATES[stage];
  if (!e) throw new Error(`unknown stage: ${stage}`);
  return usageToEur(model, {
    inputTokens: e.tokensIn,
    outputTokens: e.tokensOut,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
  });
}

export function fmtEur(n: number): string {
  return `€${n.toFixed(2)}`;
}
