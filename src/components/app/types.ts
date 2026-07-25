export type ModelId = "claude-sonnet-5" | "claude-haiku-4-5" | "claude-opus-5";

export interface ModelInfo {
  id: ModelId;
  label: string;
  blurb: string;
  inPerMTok: number;
  outPerMTok: number;
}

export const MODELS: ModelInfo[] = [
  {
    id: "claude-sonnet-5",
    label: "Balanced (recommended)",
    blurb: "Best quality per euro",
    inPerMTok: 3,
    outPerMTok: 15,
  },
  {
    id: "claude-haiku-4-5",
    label: "Budget",
    blurb: "Cheapest, good drafts",
    inPerMTok: 1,
    outPerMTok: 5,
  },
  {
    id: "claude-opus-5",
    label: "Best strategy",
    blurb: "Deepest thinking, priciest",
    inPerMTok: 5,
    outPerMTok: 25,
  },
];

export interface Intake {
  sell: string;
  buyer: string;
  region: string;
  budget: number | null;
  hours: number | null;
  channels: string[];
  goal: string;
  voiceSamples: string;
}

export interface ChannelChoice {
  channel: string;
  reason: string;
}

export interface Strategy {
  positioning: string;
  icp: string;
  chosen: ChannelChoice[];
  rejected: ChannelChoice[];
  budgetSplit: { item: string; eur: number }[];
  kpis: { name: string; target: string; where: string }[];
}

export interface CalendarItem {
  week: number;
  channel: string;
  assetType: string;
  title: string;
  minutes: number;
}

export interface CopyAsset {
  week: number;
  channel: string;
  title: string;
  body: string;
}

export interface Campaign {
  strategy: Strategy | null;
  calendar: CalendarItem[] | null;
  copy: CopyAsset[] | null;
}

export type GenStage = "strategy" | "calendar" | "copy";

export type Phase = "gate" | "intake" | "generation" | "result";

export interface WizardState {
  phase: Phase;
  demo: boolean;
  model: ModelId;
  keyPresent: boolean;
  intake: Intake;
  intakeStep: number;
  campaign: Campaign;
  stale: Record<GenStage, boolean>;
  running: GenStage | null;
  tokensIn: number;
  tokensOut: number;
  costEur: number;
}

export type Action =
  | { type: "KEY_SET" }
  | { type: "KEY_CLEARED" }
  | { type: "SET_MODEL"; model: ModelId }
  | { type: "START_DEMO"; campaign: Campaign }
  | { type: "START_INTAKE" }
  | { type: "SET_FIELD"; field: keyof Intake; value: Intake[keyof Intake] }
  | { type: "STEP_NEXT" }
  | { type: "STEP_PREV" }
  | { type: "STEP_GOTO"; step: number }
  | { type: "SUBMIT_INTAKE" }
  | { type: "STAGE_START"; stage: GenStage }
  | {
      type: "STAGE_DONE";
      stage: GenStage;
      data: Strategy | CalendarItem[] | CopyAsset[];
    }
  | { type: "STAGE_FAIL" }
  | { type: "REGENERATE"; stage: GenStage }
  | { type: "TO_GATE" }
  | { type: "ADD_USAGE"; tokensIn: number; tokensOut: number; costEur: number }
  | { type: "TO_RESULT" }
  | { type: "BACK_TO_GENERATION" }
  | { type: "RESET" };

export const initialState: WizardState = {
  phase: "gate",
  demo: false,
  model: "claude-sonnet-5",
  keyPresent: false,
  intake: {
    sell: "",
    buyer: "",
    region: "",
    budget: null,
    hours: null,
    channels: [],
    goal: "",
    voiceSamples: "",
  },
  intakeStep: 0,
  campaign: { strategy: null, calendar: null, copy: null },
  stale: { strategy: false, calendar: false, copy: false },
  running: null,
  tokensIn: 0,
  tokensOut: 0,
  costEur: 0,
};
