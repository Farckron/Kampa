// Real generation. One stage per call; copy is split into week batches so no
// single response runs into max_tokens.
//
// The api key is read from storage at call time, held in a local, passed to
// fetch, and never stored, logged or put in an error.
import type { Dispatch } from "react";

import { ApiError, streamMessage } from "@/lib/anthropic";
import { usageToEur } from "@/lib/cost";
import {
  validateCalendar,
  validateCopy,
  validateStrategy,
} from "@/lib/prompts/schemas";
import { buildStrategyPrompt, type BuiltPrompt } from "@/lib/prompts/stage1-strategy";
import { buildCalendarPrompt } from "@/lib/prompts/stage2-calendar";
import { buildCopyPrompt, COPY_BATCHES } from "@/lib/prompts/stage3-copy";

import * as storage from "./storage";
import type {
  Action,
  CalendarItem,
  Campaign,
  CopyAsset,
  GenStage,
  Intake,
  ModelId,
  Strategy,
} from "./types";

export interface RunContext {
  intake: Intake;
  model: ModelId;
  campaign: Campaign;
  onError: (e: ApiError) => void;
  /** Receives the text streamed so far for this stage, for the live preview. */
  onPreview?: (text: string) => void;
}

/** One call plus, if the reply does not validate, exactly one corrective retry. */
async function generate<T>(
  apiKey: string,
  model: ModelId,
  prompt: BuiltPrompt,
  validate: (x: unknown) => T,
  dispatch: Dispatch<Action>,
  onPreview: ((text: string) => void) | undefined,
  previewSoFar: string,
): Promise<{ value: T; preview: string }> {
  let userText = prompt.userText;
  let preview = previewSoFar;

  for (let attempt = 0; ; attempt++) {
    let acc = preview;
    const { text, usage } = await streamMessage({
      apiKey,
      model,
      system: prompt.system,
      userText,
      maxTokens: prompt.maxTokens,
      schema: prompt.schema,
      cacheSystem: true,
      ...(onPreview
        ? {
            onText: (chunk: string) => {
              acc += chunk;
              onPreview(acc);
            },
          }
        : {}),
    });

    dispatch({
      type: "ADD_USAGE",
      tokensIn: usage.inputTokens + usage.cacheReadTokens + usage.cacheWriteTokens,
      tokensOut: usage.outputTokens,
      costEur: usageToEur(model, usage),
    });

    try {
      return { value: validate(JSON.parse(text)), preview: acc };
    } catch (e) {
      if (attempt >= 1)
        throw new ApiError(
          "invalid",
          "Claude sent back something we could not read, twice in a row. Try again, or switch model.",
        );
      preview = acc;
      userText = `${prompt.userText}\n\nYour previous reply failed validation: ${
        e instanceof Error ? e.message : String(e)
      }. Return corrected JSON only.`;
    }
  }
}

function need<T>(x: T | null, message: string): T {
  if (x === null) throw new ApiError("invalid", message);
  return x;
}

export async function runStageReal(
  dispatch: Dispatch<Action>,
  stage: GenStage,
  ctx: RunContext,
): Promise<void> {
  const apiKey = storage.getKey();
  if (apiKey === null) {
    ctx.onError(
      new ApiError(
        "auth",
        "Your key is gone from this browser session — paste it again.",
      ),
    );
    return;
  }

  dispatch({ type: "STAGE_START", stage });
  ctx.onPreview?.("");

  const run = <T>(p: BuiltPrompt, v: (x: unknown) => T, so_far = "") =>
    generate(apiKey, ctx.model, p, v, dispatch, ctx.onPreview, so_far);

  try {
    let data: Strategy | CalendarItem[] | CopyAsset[];

    if (stage === "strategy") {
      data = (await run(buildStrategyPrompt(ctx.intake), validateStrategy)).value;
    } else if (stage === "calendar") {
      const strategy = need(ctx.campaign.strategy, "Generate the strategy first.");
      data = (await run(buildCalendarPrompt(ctx.intake, strategy), validateCalendar))
        .value;
    } else {
      const strategy = need(ctx.campaign.strategy, "Generate the strategy first.");
      const calendar = need(ctx.campaign.calendar, "Generate the calendar first.");
      const assets: CopyAsset[] = [];
      let preview = "";
      for (const weeks of COPY_BATCHES) {
        const out = await run(
          buildCopyPrompt(ctx.intake, strategy, calendar, weeks),
          validateCopy,
          preview,
        );
        assets.push(...out.value);
        preview = out.preview;
      }
      data = assets;
    }

    dispatch({ type: "STAGE_DONE", stage, data });
  } catch (e) {
    dispatch({ type: "STAGE_FAIL" });
    ctx.onError(
      e instanceof ApiError
        ? e
        : new ApiError("network", "Something went wrong. Try that stage again."),
    );
  }
}

// --- client-side constraint checks -----------------------------------------
// The prompt asks for these; the model does not always deliver. Checked here so
// the owner is told rather than handed a plan that quietly breaks their budget.

export function checkBudget(strategy: Strategy, intake: Intake): string | null {
  if (intake.budget === null) return null;
  const sum = strategy.budgetSplit.reduce((t, b) => t + b.eur, 0);
  if (Math.abs(sum - intake.budget) < 0.005) return null;
  const over = sum > intake.budget;
  return `The budget split adds up to €${sum.toFixed(0)}, but you said €${intake.budget} — ${
    over ? `€${(sum - intake.budget).toFixed(0)} too much` : `€${(intake.budget - sum).toFixed(0)} unspent`
  }. Regenerate the strategy to get the arithmetic right.`;
}

export function checkHours(
  calendar: CalendarItem[],
  intake: Intake,
): string | null {
  if (intake.hours === null) return null;
  const cap = intake.hours * 60;
  const perWeek = new Map<number, number>();
  for (const it of calendar)
    perWeek.set(it.week, (perWeek.get(it.week) ?? 0) + it.minutes);

  const over = [...perWeek.entries()]
    .filter(([, mins]) => mins > cap)
    .sort((a, b) => a[0] - b[0]);
  if (over.length === 0) return null;

  const list = over.map(([w, mins]) => `week ${w} (${mins} min)`).join(", ");
  return `${over.length === 1 ? "One week goes" : `${over.length} weeks go`} over your ${intake.hours} hours (${cap} min): ${list}. Regenerate the calendar to fit the time you actually have.`;
}
