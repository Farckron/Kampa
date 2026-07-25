import type {
  Action,
  CalendarItem,
  CopyAsset,
  GenStage,
  Strategy,
  WizardState,
} from "./types";
import { initialState } from "./types";

const MAX_STEP = 7;
const clamp = (n: number) => Math.min(MAX_STEP, Math.max(0, n));

// Stages that must be rebuilt when `stage` changes.
const downstream: Record<GenStage, GenStage[]> = {
  strategy: ["calendar", "copy"],
  calendar: ["copy"],
  copy: [],
};

export function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case "KEY_SET":
      return { ...state, keyPresent: true };

    case "KEY_CLEARED":
      // Non-destructive: keep the campaign and the answers, only lose the key.
      return {
        ...state,
        keyPresent: false,
        phase: state.campaign.strategy === null ? "gate" : state.phase,
      };

    case "SET_MODEL":
      return { ...state, model: action.model };

    case "START_DEMO":
      return {
        ...state,
        demo: true,
        campaign: action.campaign,
        phase: "result",
      };

    case "START_INTAKE":
      return { ...state, phase: "intake" };

    case "SET_FIELD":
      return {
        ...state,
        intake: { ...state.intake, [action.field]: action.value },
      };

    case "STEP_NEXT":
      return { ...state, intakeStep: clamp(state.intakeStep + 1) };

    case "STEP_PREV":
      return { ...state, intakeStep: clamp(state.intakeStep - 1) };

    case "STEP_GOTO":
      return { ...state, intakeStep: clamp(action.step) };

    case "SUBMIT_INTAKE":
      return { ...state, phase: "generation" };

    case "STAGE_START":
      return { ...state, running: action.stage };

    case "STAGE_DONE": {
      const campaign = { ...state.campaign };
      if (action.stage === "strategy")
        campaign.strategy = action.data as Strategy;
      else if (action.stage === "calendar")
        campaign.calendar = action.data as CalendarItem[];
      else campaign.copy = action.data as CopyAsset[];

      const stale = { ...state.stale, [action.stage]: false };
      for (const s of downstream[action.stage]) {
        if (state.campaign[s] !== null) stale[s] = true;
      }
      return { ...state, campaign, stale, running: null };
    }

    // A stage that errored keeps no partial data — it just stops running.
    case "STAGE_FAIL":
      return { ...state, running: null };

    case "TO_GATE":
      return { ...state, keyPresent: false, phase: "gate" };

    case "REGENERATE": {
      const campaign = { ...state.campaign, [action.stage]: null };
      const stale = { ...state.stale, [action.stage]: false };
      // Downstream keeps its data, but it no longer matches — flag it.
      for (const s of downstream[action.stage]) {
        stale[s] = state.campaign[s] !== null;
      }
      return { ...state, campaign, stale, phase: "generation" };
    }

    case "ADD_USAGE":
      return {
        ...state,
        tokensIn: state.tokensIn + action.tokensIn,
        tokensOut: state.tokensOut + action.tokensOut,
        costEur: state.costEur + action.costEur,
      };

    case "TO_RESULT": {
      const { strategy, calendar, copy } = state.campaign;
      if (!strategy || !calendar || !copy) return state;
      return { ...state, phase: "result" };
    }

    case "BACK_TO_GENERATION":
      return { ...state, phase: "generation" };

    case "RESET":
      return initialState;
  }
}
