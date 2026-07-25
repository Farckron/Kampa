import { describe, expect, it } from "vitest";
import { reducer } from "@/components/app/reducer";
import { initialState } from "@/components/app/types";
import type {
  CalendarItem,
  CopyAsset,
  Strategy,
  WizardState,
} from "@/components/app/types";
import { demoCampaign } from "@/components/app/demo-campaign";

const strategy = demoCampaign.strategy as Strategy;
const calendar = demoCampaign.calendar as CalendarItem[];
const copy = demoCampaign.copy as CopyAsset[];

const full: WizardState = {
  ...initialState,
  phase: "generation",
  campaign: { strategy, calendar, copy },
};

describe("reducer", () => {
  it("KEY_SET / KEY_CLEARED", () => {
    const set = reducer(initialState, { type: "KEY_SET" });
    expect(set.keyPresent).toBe(true);
    // clearing wipes everything back to the gate
    expect(reducer(full, { type: "KEY_CLEARED" })).toEqual(initialState);
  });

  it("SET_MODEL", () => {
    expect(
      reducer(initialState, { type: "SET_MODEL", model: "claude-opus-5" })
        .model,
    ).toBe("claude-opus-5");
  });

  it("START_DEMO jumps straight to result", () => {
    const s = reducer(initialState, {
      type: "START_DEMO",
      campaign: demoCampaign,
    });
    expect(s.demo).toBe(true);
    expect(s.phase).toBe("result");
    expect(s.campaign.copy).toHaveLength(6);
  });

  it("START_INTAKE / SUBMIT_INTAKE / BACK_TO_GENERATION move phases", () => {
    expect(reducer(initialState, { type: "START_INTAKE" }).phase).toBe(
      "intake",
    );
    expect(reducer(initialState, { type: "SUBMIT_INTAKE" }).phase).toBe(
      "generation",
    );
    expect(reducer(initialState, { type: "BACK_TO_GENERATION" }).phase).toBe(
      "generation",
    );
  });

  it("SET_FIELD writes one intake field and leaves the rest", () => {
    const s = reducer(initialState, {
      type: "SET_FIELD",
      field: "budget",
      value: 400,
    });
    expect(s.intake.budget).toBe(400);
    expect(s.intake.sell).toBe("");
    expect(
      reducer(s, { type: "SET_FIELD", field: "channels", value: ["Email"] })
        .intake.channels,
    ).toEqual(["Email"]);
  });

  it("steps clamp to 0..7", () => {
    expect(reducer(initialState, { type: "STEP_PREV" }).intakeStep).toBe(0);
    expect(reducer(initialState, { type: "STEP_NEXT" }).intakeStep).toBe(1);
    expect(
      reducer({ ...initialState, intakeStep: 7 }, { type: "STEP_NEXT" })
        .intakeStep,
    ).toBe(7);
    expect(
      reducer(initialState, { type: "STEP_GOTO", step: 99 }).intakeStep,
    ).toBe(7);
    expect(
      reducer(initialState, { type: "STEP_GOTO", step: -3 }).intakeStep,
    ).toBe(0);
    expect(
      reducer({ ...initialState, intakeStep: 4 }, { type: "STEP_PREV" })
        .intakeStep,
    ).toBe(3);
  });

  it("STAGE_START sets running, STAGE_DONE clears it and stores data", () => {
    const running = reducer(initialState, {
      type: "STAGE_START",
      stage: "strategy",
    });
    expect(running.running).toBe("strategy");
    const done = reducer(running, {
      type: "STAGE_DONE",
      stage: "strategy",
      data: strategy,
    });
    expect(done.running).toBeNull();
    expect(done.campaign.strategy).toBe(strategy);
    expect(done.stale.strategy).toBe(false);
  });

  it("STAGE_DONE marks downstream stale only when downstream data exists", () => {
    const fresh = reducer(initialState, {
      type: "STAGE_DONE",
      stage: "strategy",
      data: strategy,
    });
    expect(fresh.stale).toEqual({
      strategy: false,
      calendar: false,
      copy: false,
    });

    const cascaded = reducer(full, {
      type: "STAGE_DONE",
      stage: "strategy",
      data: strategy,
    });
    expect(cascaded.stale).toEqual({
      strategy: false,
      calendar: true,
      copy: true,
    });

    const calDone = reducer(full, {
      type: "STAGE_DONE",
      stage: "calendar",
      data: calendar,
    });
    expect(calDone.stale).toEqual({
      strategy: false,
      calendar: false,
      copy: true,
    });

    const copyDone = reducer(
      { ...full, stale: { strategy: false, calendar: false, copy: true } },
      { type: "STAGE_DONE", stage: "copy", data: copy },
    );
    expect(copyDone.stale.copy).toBe(false);
    expect(copyDone.campaign.copy).toBe(copy);
  });

  it("REGENERATE nulls the stage and everything downstream", () => {
    const s = reducer(
      { ...full, phase: "result" },
      { type: "REGENERATE", stage: "calendar" },
    );
    expect(s.phase).toBe("generation");
    expect(s.campaign.strategy).toBe(strategy);
    expect(s.campaign.calendar).toBeNull();
    expect(s.campaign.copy).toBeNull();
    expect(s.stale).toEqual({ strategy: false, calendar: false, copy: false });

    const all = reducer(full, { type: "REGENERATE", stage: "strategy" });
    expect(all.campaign).toEqual({
      strategy: null,
      calendar: null,
      copy: null,
    });
  });

  it("ADD_USAGE accumulates", () => {
    const once = reducer(initialState, {
      type: "ADD_USAGE",
      tokensIn: 100,
      tokensOut: 20,
      costEur: 0.5,
    });
    const twice = reducer(once, {
      type: "ADD_USAGE",
      tokensIn: 50,
      tokensOut: 5,
      costEur: 0.25,
    });
    expect(twice.tokensIn).toBe(150);
    expect(twice.tokensOut).toBe(25);
    expect(twice.costEur).toBeCloseTo(0.75);
  });

  it("TO_RESULT only fires when all three stages are done", () => {
    expect(reducer(initialState, { type: "TO_RESULT" }).phase).toBe("gate");
    const partial: WizardState = {
      ...initialState,
      campaign: { strategy, calendar, copy: null },
    };
    expect(reducer(partial, { type: "TO_RESULT" })).toBe(partial);
    expect(reducer(full, { type: "TO_RESULT" }).phase).toBe("result");
  });

  it("RESET returns the initial state", () => {
    expect(
      reducer({ ...full, tokensIn: 9, keyPresent: true }, { type: "RESET" }),
    ).toEqual(initialState);
  });
});
