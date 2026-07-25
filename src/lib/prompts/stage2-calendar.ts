import type { Intake, Strategy } from "@/components/app/types";
import { CALENDAR_SCHEMA } from "./schemas";
import { SYSTEM_PROMPT } from "./system";
import {
  intakeBlock,
  strategyBlock,
  type BuiltPrompt,
} from "./stage1-strategy";

export function buildCalendarPrompt(
  intake: Intake,
  strategy: Strategy,
): BuiltPrompt {
  const minutes = intake.hours === null ? null : intake.hours * 60;
  const channels = strategy.chosen.map((c) => c.channel).join(", ");

  const task = `TASK
Produce the 12-week calendar JSON.

- Use ONLY these channels: ${channels}. Nothing else, not even once.
- Cover all 12 weeks. At least one item per week, at least 12 items total.
- Per week, the minutes across all items must sum to ${minutes === null ? "the owner's weekly hours in minutes" : `${minutes} minutes or less`}. Count generously: the owner is new at this and slower than a marketer. A first Reel is 45 minutes, a written newsletter is 60, a photo set at the shop is 40.
- Every item is a concrete thing to make, with the actual subject in the title. "Reel: repairing a snapped cable at the workbench, shot on your phone" — not "engaging video content".
- assetType is what it physically is: Reel, Post, Story, Email, Photo set, Flyer, Google Business post, DM outreach, Event.
- Front-load setup in weeks 1-2 (profile fixes, list, templates), then a steady rhythm. No empty weeks.
- Never repeat the same title twice.

Return JSON only.`;

  return {
    system: SYSTEM_PROMPT,
    blocks: [intakeBlock(intake), strategyBlock(strategy), { text: task }],
    schema: CALENDAR_SCHEMA,
    maxTokens: 24000,
  };
}
