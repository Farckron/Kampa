import type { CalendarItem, Intake, Strategy } from "@/components/app/types";
import { COPY_SCHEMA } from "./schemas";
import { SYSTEM_PROMPT } from "./system";
import {
  intakeBlock,
  strategyBlock,
  type BuiltPrompt,
} from "./stage1-strategy";

/** Copy is generated in three calls so no single response hits max_tokens. */
export const COPY_BATCHES: number[][] = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
];

export function buildCopyPrompt(
  intake: Intake,
  strategy: Strategy,
  calendarItems: CalendarItem[],
  weeks: number[],
): BuiltPrompt {
  const batch = calendarItems.filter((it) => weeks.includes(it.week));

  const task = `CALENDAR ITEMS TO WRITE — WEEKS ${weeks.join(", ")}
${JSON.stringify(batch, null, 2)}

TASK
Write the finished copy for these ${batch.length} items and nothing else. One asset per calendar item above, same week and same channel, title matching the calendar item.

- body is the real text, ready to paste: the caption, the email, the flyer wording. Not a brief, not bullet points about what to write.
- Write in the owner's voice, copied from the VOICE SAMPLES above: their sentence length, their contractions, their greeting, their punctuation habits, their regional words. If no samples were given, write plain and warm: short sentences, no hype, no exclamation marks.
- Length fits the channel: a Reel caption is 1-3 lines plus hashtags only if the owner already uses them; an email is 120-200 words; a flyer is under 60 words.
- Mark everything you cannot know with [NEEDS YOU: ...] inline — photos, prices, opening hours, availability, and any legal, medical, safety or origin claim. Never invent a number or a claim.
- No jargon. Nothing that would read the same for any other business in town.

Return JSON only.`;

  return {
    system: SYSTEM_PROMPT,
    blocks: [intakeBlock(intake), strategyBlock(strategy), { text: task }],
    schema: COPY_SCHEMA,
    maxTokens: 5000,
  };
}
