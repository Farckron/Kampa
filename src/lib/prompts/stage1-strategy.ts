import type { Intake, Strategy } from "@/components/app/types";
import type { UserBlock } from "@/lib/anthropic";
import { STRATEGY_SCHEMA } from "./schemas";
import { SYSTEM_PROMPT } from "./system";

export interface BuiltPrompt {
  system: string;
  /** Cacheable prefix blocks first, the stage's own task text last. */
  blocks: UserBlock[];
  schema: object;
  maxTokens: number;
}

/** The intake asks for a MONTHLY budget (SPEC §4.2 q4) but the plan covers 90
 *  days. This is the pot the model is told about and the pot checkBudget()
 *  validates the split against — they must never disagree. */
export function budget90(intake: Intake): number {
  return (intake.budget ?? 0) * 3;
}

/** Labelled intake block. Shared by all three stages so the model sees the
 *  owner's answers in the same shape every time (and the cache stays warm). */
export function intakeSections(intake: Intake): string {
  return [
    `SELL: ${intake.sell || "(not given)"}`,
    `BUYER: ${intake.buyer || "(not given)"}`,
    `REGION: ${intake.region || "(not given)"}`,
    `BUDGET €: ${intake.budget === null ? "(not given)" : `${budget90(intake)} EUR total for the 90 days (${intake.budget} EUR per month)`}`,
    `HOURS PER WEEK: ${intake.hours === null ? "(not given)" : `${intake.hours} (= ${intake.hours * 60} minutes per week, hard ceiling)`}`,
    `CHANNELS ALREADY USED: ${intake.channels.length > 0 ? intake.channels.join(", ") : "(none)"}`,
    `90-DAY GOAL: ${intake.goal || "(not given)"}`,
    `VOICE SAMPLES:\n${intake.voiceSamples.trim() || "(none given — use a plain, warm, neutral register)"}`,
  ].join("\n\n");
}

/** Byte-identical across all three stages, so it earns a cache breakpoint. */
export function intakeBlock(intake: Intake): UserBlock {
  return {
    text: `Here is the business.\n\n${intakeSections(intake)}`,
    cache: true,
  };
}

/** Sent verbatim by stages 2 and 3 (and three times over for the copy
 *  batches), so it earns one too. */
export function strategyBlock(strategy: Strategy): UserBlock {
  return {
    text: `STRATEGY ALREADY AGREED (do not revisit it)\n${JSON.stringify(strategy, null, 2)}`,
    cache: true,
  };
}

export function buildStrategyPrompt(intake: Intake): BuiltPrompt {
  const budget = budget90(intake);
  const task = `TASK
Produce the strategy JSON.

- positioning: one or two sentences saying what this business is for and who it beats, in plain words the owner would say out loud.
- icp: the one buyer worth chasing for the next 90 days. Be specific enough that the owner can picture a real person: age range, situation, what triggers the purchase, where they already are.
- chosen: 2 or 3 channels, each with a reason naming a real cost, a real number, or a real fit. No "great for brand awareness".
- rejected: at least 3 channels the owner used, expects, or would feel guilty about skipping. One line each saying why not, in hours or euros.
- budgetSplit: line items that sum EXACTLY to ${budget} EUR. Check the arithmetic before you answer. If some money is better held back, make that an explicit line item so the total still lands on ${budget}.
- kpis: exactly 3, each measurable with free tools the owner already has (Google Business Profile insights, native platform insights, replies in an inbox, a tally by the till). Give a number and a deadline in the target.

Everything must fit ${intake.hours === null ? "the stated" : intake.hours} hours a week. Return JSON only.`;

  return {
    system: SYSTEM_PROMPT,
    blocks: [intakeBlock(intake), { text: task }],
    schema: STRATEGY_SCHEMA,
    maxTokens: 3000,
  };
}
