// Real generation. One stage per call; copy is split into week batches so no
// single response runs into max_tokens.
//
// The api key is read from storage at call time, held in a local, passed to
// fetch, and never stored, logged or put in an error.
import type { Dispatch } from "react";

import { ApiError, streamMessage, type StreamOptions } from "@/lib/anthropic";
import { usageToEur } from "@/lib/cost";
import {
  validateCalendar,
  validateCopy,
  validateStrategy,
} from "@/lib/prompts/schemas";
import {
  budget90,
  buildStrategyPrompt,
  type BuiltPrompt,
} from "@/lib/prompts/stage1-strategy";
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  let blocks = prompt.blocks;
  let preview = previewSoFar;
  // SPEC §2.4: max 1 automatic retry on 5xx. Spent once per stage call, so it
  // cannot compound with the validation retry below into four requests.
  let retriedTransport = false;

  const call = async (opts: StreamOptions) => {
    try {
      return await streamMessage(opts);
    } catch (e) {
      if (
        retriedTransport ||
        !(e instanceof ApiError) ||
        (e.kind !== "overloaded" && e.kind !== "rate_limit")
      )
        throw e;
      retriedTransport = true;
      // ponytail: fixed 1s pause unless the server named a wait.
      await sleep((e.retryAfterSec ?? 1) * 1000);
      return streamMessage(opts);
    }
  };

  for (let attempt = 0; ; attempt++) {
    let acc = preview;
    const { text, usage, stopReason } = await call({
      apiKey,
      model,
      system: prompt.system,
      userBlocks: blocks,
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
      tokensIn:
        usage.inputTokens + usage.cacheReadTokens + usage.cacheWriteTokens,
      tokensOut: usage.outputTokens,
      costEur: usageToEur(model, usage),
    });

    if (stopReason === "max_tokens")
      throw new ApiError(
        "invalid",
        "The response ran out of room and was cut off mid-answer. Regenerate — if it happens again on Haiku, switch to a bigger model.",
      );
    try {
      return { value: validate(JSON.parse(stripFence(text))), preview: acc };
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      // Model output only — never contains the key. Kept for diagnosability.
      console.debug("[kampa] stage output failed validation:", detail, text);
      if (attempt >= 1)
        throw new ApiError(
          "invalid",
          `Claude sent back something we could not read, twice in a row (${detail.slice(0, 200)}). Try again, or switch model.`,
        );
      preview = acc;
      // Correct in the task block; the cached intake/strategy prefix stays put.
      const last = prompt.blocks[prompt.blocks.length - 1]!;
      blocks = [
        ...prompt.blocks.slice(0, -1),
        {
          ...last,
          text: `${last.text}\n\nYour previous reply failed validation: ${
            e instanceof Error ? e.message : String(e)
          }. Return corrected JSON only.`,
        },
      ];
    }
  }
}

/** Models occasionally wrap JSON in a ```json fence despite instructions. */
export function stripFence(text: string): string {
  const t = text.trim();
  const m = t.match(/^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/);
  return m ? m[1]! : t;
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
      data = (await run(buildStrategyPrompt(ctx.intake), validateStrategy))
        .value;
    } else if (stage === "calendar") {
      const strategy = need(
        ctx.campaign.strategy,
        "Generate the strategy first.",
      );
      data = (
        await run(buildCalendarPrompt(ctx.intake, strategy), validateCalendar)
      ).value;
    } else {
      const strategy = need(
        ctx.campaign.strategy,
        "Generate the strategy first.",
      );
      const calendar = need(
        ctx.campaign.calendar,
        "Generate the calendar first.",
      );
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
        : new ApiError(
            "network",
            "Something went wrong. Try that stage again.",
          ),
    );
  }
}

// --- client-side constraint checks -----------------------------------------
// The prompt asks for these; the model does not always deliver. Checked here so
// the owner is told rather than handed a plan that quietly breaks their budget.

export function checkBudget(strategy: Strategy, intake: Intake): string | null {
  if (intake.budget === null) return null;
  // Same 90-day pot the prompt states — see budget90().
  const total = budget90(intake);
  const sum = strategy.budgetSplit.reduce((t, b) => t + b.eur, 0);
  if (Math.abs(sum - total) < 0.005) return null;
  const over = sum > total;
  return `The budget split adds up to €${sum.toFixed(0)}, but 90 days at €${intake.budget} a month is €${total} — ${
    over
      ? `€${(sum - total).toFixed(0)} too much`
      : `€${(total - sum).toFixed(0)} unspent`
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
