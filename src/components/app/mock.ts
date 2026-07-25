// MOCK — replaced by real API in Stage 05.
// Every stage resolves off the bundled demo fixture after a short delay, so the
// wizard is fully clickable with zero network traffic and no key spend.
import type { Dispatch } from "react";

import { demoCampaign } from "./demo-campaign";
import { MODELS } from "./types";
import type { Action, GenStage, ModelId } from "./types";

const DELAY_MS = 800;

// Token counts chosen so the sonnet cost lands on the per-stage estimates the
// generation screen advertises (~€0.15 / €0.20 / €0.45).
const USAGE: Record<GenStage, { tokensIn: number; tokensOut: number }> = {
  strategy: { tokensIn: 12000, tokensOut: 7500 },
  calendar: { tokensIn: 18000, tokensOut: 9700 },
  copy: { tokensIn: 30000, tokensOut: 24000 },
};

export function costEur(
  model: ModelId,
  tokensIn: number,
  tokensOut: number,
): number {
  const m = MODELS.find((x) => x.id === model) ?? MODELS[0]!;
  return (tokensIn * m.inPerMTok + tokensOut * m.outPerMTok) / 1_000_000;
}

export function mockRunStage(
  dispatch: Dispatch<Action>,
  stage: GenStage,
  model: ModelId,
): void {
  const data =
    stage === "strategy"
      ? demoCampaign.strategy
      : stage === "calendar"
        ? demoCampaign.calendar
        : demoCampaign.copy;
  if (data === null) throw new Error(`demo fixture is missing ${stage}`);

  const { tokensIn, tokensOut } = USAGE[stage];
  dispatch({ type: "STAGE_START", stage });
  setTimeout(() => {
    dispatch({ type: "STAGE_DONE", stage, data });
    dispatch({
      type: "ADD_USAGE",
      tokensIn,
      tokensOut,
      costEur: costEur(model, tokensIn, tokensOut),
    });
  }, DELAY_MS);
}
