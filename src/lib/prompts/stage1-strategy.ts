import type { Intake } from "@/components/app/types";
import { STRATEGY_SCHEMA } from "./schemas";
import { SYSTEM_PROMPT } from "./system";

export interface BuiltPrompt {
  system: string;
  userText: string;
  schema: object;
  maxTokens: number;
}

/** Labelled intake block. Shared by all three stages so the model sees the
 *  owner's answers in the same shape every time (and the cache stays warm). */
export function intakeSections(intake: Intake): string {
  return [
    `SELL: ${intake.sell || "(not given)"}`,
    `BUYER: ${intake.buyer || "(not given)"}`,
    `REGION: ${intake.region || "(not given)"}`,
    `BUDGET €: ${intake.budget === null ? "(not given)" : `${intake.budget} EUR total for the 90 days`}`,
    `HOURS PER WEEK: ${intake.hours === null ? "(not given)" : `${intake.hours} (= ${intake.hours * 60} minutes per week, hard ceiling)`}`,
    `CHANNELS ALREADY USED: ${intake.channels.length > 0 ? intake.channels.join(", ") : "(none)"}`,
    `90-DAY GOAL: ${intake.goal || "(not given)"}`,
    `VOICE SAMPLES:\n${intake.voiceSamples.trim() || "(none given — use a plain, warm, neutral register)"}`,
  ].join("\n\n");
}

export function buildStrategyPrompt(intake: Intake): BuiltPrompt {
  const budget = intake.budget === null ? 0 : intake.budget;
  const userText = `Here is the business.

${intakeSections(intake)}

TASK
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
    userText,
    schema: STRATEGY_SCHEMA,
    maxTokens: 3000,
  };
}
