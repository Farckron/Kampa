import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/anthropic";
import { streamMessage } from "@/lib/anthropic";
import {
  checkBudget,
  checkHours,
  runStageReal,
  type RunContext,
} from "@/components/app/engine";
import type {
  Action,
  CalendarItem,
  Intake,
  Strategy,
} from "@/components/app/types";

vi.mock("@/lib/anthropic", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/anthropic")>();
  return { ...actual, streamMessage: vi.fn() };
});

const stream = vi.mocked(streamMessage);

const KEY = "sk-ant-test-0000000000000000000000";

const intake: Intake = {
  sell: "Bike repairs",
  buyer: "Commuters",
  region: "Riga",
  budget: 400,
  hours: 4,
  channels: ["Instagram"],
  goal: "More repeat repairs",
  voiceSamples: "We fix bikes. Come by.",
};

const strategy: Strategy = {
  positioning: "The fast local bike fix.",
  icp: "Commuters aged 25-45 who ride daily.",
  chosen: [
    { channel: "Instagram", reason: "40 local views per post, 25 min each." },
    { channel: "Google Business", reason: "Free, 120 searches a month." },
  ],
  rejected: [
    { channel: "TikTok", reason: "4h a week you do not have." },
    { channel: "Paid search", reason: "300 EUR buys 40 clicks." },
    { channel: "Podcast", reason: "8h per episode." },
  ],
  budgetSplit: [
    { item: "Boosted posts", eur: 240 },
    { item: "Flyers", eur: 160 },
  ],
  kpis: [
    { name: "Repairs booked", target: "20 by week 12", where: "Till tally" },
    { name: "Profile views", target: "120/month", where: "GBP dashboard" },
    { name: "Replies", target: "10 by week 8", where: "Inbox" },
  ],
};

const calendar: CalendarItem[] = Array.from({ length: 12 }, (_, i) => ({
  week: i + 1,
  channel: "Instagram",
  assetType: "Post",
  title: `Week ${i + 1} post about a real repair`,
  minutes: 60,
}));

const usage = {
  inputTokens: 1000,
  outputTokens: 500,
  cacheReadTokens: 200,
  cacheWriteTokens: 100,
};

const reply = (obj: unknown) => ({
  text: JSON.stringify(obj),
  usage,
  stopReason: "end_turn" as const,
});

function harness(over: Partial<RunContext> = {}) {
  const actions: Action[] = [];
  const errors: ApiError[] = [];
  const ctx: RunContext = {
    intake,
    model: "claude-sonnet-5",
    campaign: { strategy, calendar, copy: null },
    onError: (e) => errors.push(e),
    ...over,
  };
  return { actions, errors, ctx, dispatch: (a: Action) => actions.push(a) };
}

beforeEach(() => {
  stream.mockReset();
  window.sessionStorage.clear();
  window.localStorage.clear();
  window.sessionStorage.setItem("kampa.key", KEY);
});

describe("runStageReal", () => {
  it("dispatches STAGE_START, ADD_USAGE then STAGE_DONE on the happy path", async () => {
    stream.mockResolvedValue(reply(strategy));
    const h = harness();

    await runStageReal(h.dispatch, "strategy", h.ctx);

    expect(h.actions.map((a) => a.type)).toEqual([
      "STAGE_START",
      "ADD_USAGE",
      "STAGE_DONE",
    ]);
    // input + both cache buckets are billed, so all three land in the meter
    expect(h.actions[1]).toMatchObject({ tokensIn: 1300, tokensOut: 500 });
    expect(h.actions[2]).toMatchObject({ stage: "strategy", data: strategy });
    expect(h.errors).toEqual([]);
  });

  it("sends the key from storage and never the schema-free params", async () => {
    stream.mockResolvedValue(reply(strategy));
    const h = harness();

    await runStageReal(h.dispatch, "strategy", h.ctx);

    const opts = stream.mock.calls[0]![0];
    expect(opts.apiKey).toBe(KEY);
    expect(opts.maxTokens).toBe(3000);
    expect(opts.cacheSystem).toBe(true);
    expect(opts).not.toHaveProperty("temperature");
  });

  it("errors without a key and never calls the API", async () => {
    window.sessionStorage.clear();
    const h = harness();

    await runStageReal(h.dispatch, "strategy", h.ctx);

    expect(stream).not.toHaveBeenCalled();
    expect(h.actions).toEqual([]);
    expect(h.errors[0]!.kind).toBe("auth");
    expect(h.errors[0]!.userMessage).toMatch(/paste it again/);
  });

  it("streams text into the preview callback", async () => {
    stream.mockImplementation(async (o) => {
      o.onText?.("{ \"a\"");
      o.onText?.(": 1 }");
      return reply(strategy);
    });
    const seen: string[] = [];
    const h = harness({ onPreview: (t) => seen.push(t) });

    await runStageReal(h.dispatch, "strategy", h.ctx);

    expect(seen).toEqual(["", '{ "a"', '{ "a": 1 }']);
  });

  it("retries exactly once with the validation error appended", async () => {
    stream
      .mockResolvedValueOnce({ text: "not json at all", usage, stopReason: null })
      .mockResolvedValueOnce(reply(strategy));
    const h = harness();

    await runStageReal(h.dispatch, "strategy", h.ctx);

    expect(stream).toHaveBeenCalledTimes(2);
    const retry = stream.mock.calls[1]![0].userText;
    expect(retry).toMatch(/Your previous reply failed validation: /);
    expect(retry).toMatch(/Return corrected JSON only\.$/);
    expect(h.actions.map((a) => a.type)).toEqual([
      "STAGE_START",
      "ADD_USAGE",
      "ADD_USAGE",
      "STAGE_DONE",
    ]);
  });

  it("gives up after the retry and leaves the stage pending", async () => {
    stream.mockResolvedValue({ text: "{}", usage, stopReason: null });
    const h = harness();

    await runStageReal(h.dispatch, "strategy", h.ctx);

    expect(stream).toHaveBeenCalledTimes(2);
    expect(h.actions.map((a) => a.type)).toEqual([
      "STAGE_START",
      "ADD_USAGE",
      "ADD_USAGE",
      "STAGE_FAIL",
    ]);
    expect(h.errors[0]!.kind).toBe("invalid");
  });

  it("reports an ApiError and dispatches no STAGE_DONE", async () => {
    stream.mockRejectedValue(new ApiError("rate_limit", "Rate limited", 30));
    const h = harness();

    await runStageReal(h.dispatch, "strategy", h.ctx);

    expect(h.actions.map((a) => a.type)).toEqual(["STAGE_START", "STAGE_FAIL"]);
    expect(h.errors[0]!.kind).toBe("rate_limit");
    expect(h.errors[0]!.retryAfterSec).toBe(30);
  });

  it("passes the agreed strategy into the calendar prompt", async () => {
    stream.mockResolvedValue(reply({ items: calendar }));
    const h = harness();

    await runStageReal(h.dispatch, "calendar", h.ctx);

    expect(stream.mock.calls[0]![0].userText).toContain("The fast local bike fix.");
    expect(h.actions[2]).toMatchObject({ stage: "calendar", data: calendar });
  });

  it("batches copy into three calls and accumulates the assets", async () => {
    const asset = (week: number) => ({
      week,
      channel: "Instagram",
      title: `Week ${week} post about a real repair`,
      body: "Come by, we fix it while you wait.",
    });
    stream.mockImplementation(async (o) => {
      const weeks = [...o.userText.matchAll(/WEEKS ([\d, ]+)\n/g)][0]![1]!
        .split(", ")
        .map(Number);
      return reply({ assets: weeks.map(asset) });
    });
    const h = harness();

    await runStageReal(h.dispatch, "copy", h.ctx);

    expect(stream).toHaveBeenCalledTimes(3);
    const weeksSeen = stream.mock.calls.map(
      (c) => [...c[0].userText.matchAll(/WEEKS ([\d, ]+)\n/g)][0]![1],
    );
    expect(weeksSeen).toEqual(["1, 2, 3, 4", "5, 6, 7, 8", "9, 10, 11, 12"]);

    const done = h.actions.at(-1) as Extract<Action, { type: "STAGE_DONE" }>;
    expect(done.type).toBe("STAGE_DONE");
    expect((done.data as unknown[]).length).toBe(12);
    expect(h.actions.filter((a) => a.type === "ADD_USAGE")).toHaveLength(3);
  });

  it("keeps no partial copy when a later batch fails", async () => {
    stream
      .mockResolvedValueOnce(
        reply({
          assets: [
            {
              week: 1,
              channel: "Instagram",
              title: "t",
              body: "b",
            },
          ],
        }),
      )
      .mockRejectedValueOnce(new ApiError("overloaded", "Overloaded"));
    const h = harness();

    await runStageReal(h.dispatch, "copy", h.ctx);

    expect(h.actions.some((a) => a.type === "STAGE_DONE")).toBe(false);
    expect(h.errors[0]!.kind).toBe("overloaded");
  });
});

describe("checkBudget", () => {
  const withSplit = (split: { item: string; eur: number }[]): Strategy => ({
    ...strategy,
    budgetSplit: split,
  });

  it("passes when the split lands exactly on the budget", () => {
    expect(checkBudget(strategy, intake)).toBeNull();
  });

  it("tolerates float noise", () => {
    const s = withSplit([
      { item: "a", eur: 133.33 },
      { item: "b", eur: 133.33 },
      { item: "c", eur: 133.34 },
    ]);
    expect(checkBudget(s, { ...intake, budget: 400 })).toBeNull();
  });

  it("flags overspend", () => {
    const s = withSplit([{ item: "a", eur: 500 }]);
    expect(checkBudget(s, intake)).toMatch(/€500.*€400.*€100 too much/);
  });

  it("flags underspend", () => {
    const s = withSplit([{ item: "a", eur: 350 }]);
    expect(checkBudget(s, intake)).toMatch(/€50 unspent/);
  });

  it("says nothing when no budget was given", () => {
    const s = withSplit([{ item: "a", eur: 1 }]);
    expect(checkBudget(s, { ...intake, budget: null })).toBeNull();
  });
});

describe("checkHours", () => {
  it("passes when every week fits", () => {
    expect(checkHours(calendar, intake)).toBeNull();
  });

  it("passes on the exact ceiling", () => {
    const at = calendar.map((c) => ({ ...c, minutes: 240 }));
    expect(checkHours(at, intake)).toBeNull();
  });

  it("sums items within a week before comparing", () => {
    const over = [...calendar, { ...calendar[0]!, minutes: 200 }];
    expect(checkHours(over, intake)).toMatch(/One week goes over.*week 1 \(260 min\)/);
  });

  it("lists every offending week in order", () => {
    const over = calendar.map((c) =>
      c.week === 3 || c.week === 7 ? { ...c, minutes: 300 } : c,
    );
    expect(checkHours(over, intake)).toMatch(
      /2 weeks go over your 4 hours \(240 min\): week 3 \(300 min\), week 7 \(300 min\)/,
    );
  });

  it("says nothing when no hours were given", () => {
    const over = calendar.map((c) => ({ ...c, minutes: 9999 }));
    expect(checkHours(over, { ...intake, hours: null })).toBeNull();
  });
});
