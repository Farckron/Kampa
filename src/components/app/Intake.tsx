import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { setDraft } from "./storage";
import type { Intake as Answers } from "./types";
import { useWizard } from "./WizardContext";

type Question = {
  field: keyof Answers;
  /** Short chrome label — shown in the topbar and beside the step counter. */
  short: string;
  label: string;
  helper?: string;
};

const QUESTIONS: Question[] = [
  { field: "sell", short: "Your offer", label: "What do you sell?" },
  { field: "buyer", short: "Your buyer", label: "Who buys it?" },
  {
    field: "region",
    short: "Where you sell",
    label: "Where are your customers?",
  },
  {
    field: "budget",
    short: "Budget",
    label: "Monthly marketing budget (EUR)",
    helper: "The plan covers 30 days, so this is the whole pot it spends.",
  },
  {
    field: "hours",
    short: "Your time",
    label: "Hours per week you can spend",
    helper: "Anything from 1 to 40 hours.",
  },
  { field: "channels", short: "Channels", label: "Channels you already use" },
  {
    field: "goal",
    short: "Your goal",
    label: "Your one goal for the next 30 days",
  },
  {
    field: "voiceSamples",
    short: "Your voice",
    label: "Paste 2-3 samples of your writing (posts, About page)",
    helper:
      "Optional but strongly recommended — this is how the copy ends up sounding like you.",
  },
];

// A restored draft can carry a step index that no longer exists.
const clampStep = (step: number) =>
  Math.min(Math.max(step, 0), QUESTIONS.length - 1);

/** Chrome label for the wizard topbar. */
export const stepTitle = (step: number) => QUESTIONS[clampStep(step)].short;

const NONE = "None yet";

const CHANNELS = [
  "Instagram",
  "Facebook",
  "Google Business Profile",
  "Email",
  "TikTok",
  "LinkedIn",
  "Website / SEO",
  NONE,
];

function isValid(step: number, a: Answers): boolean {
  switch (step) {
    case 0:
      return a.sell.trim() !== "";
    case 1:
      return a.buyer.trim() !== "";
    case 2:
      return a.region.trim() !== "";
    case 3:
      return a.budget !== null && a.budget >= 0;
    case 4:
      return a.hours !== null && a.hours >= 1 && a.hours <= 40;
    case 5:
      return a.channels.length > 0;
    case 6:
      return a.goal.trim() !== "";
    default:
      return true; // voiceSamples is optional
  }
}

/** Shown only after Next is pressed on an answer isValid() rejects. */
function errorFor(step: number): string {
  switch (step) {
    case 3:
      return "Enter your monthly budget as a number — 0 or more.";
    case 4:
      return "Enter a number of hours between 1 and 40.";
    case 5:
      return "Pick at least one channel, or choose “None yet”.";
    default:
      return "Please answer this question before continuing.";
  }
}

/** Segment fill: past steps get the full gradient, the current one fades out. */
function segmentBackground(index: number, step: number): string {
  if (index < step) return "var(--grad)";
  if (index === step)
    return "linear-gradient(90deg, var(--violet), var(--paper-dim) 50%)";
  return "var(--paper-dim)";
}

export function Intake() {
  const { state, dispatch } = useWizard();
  const step = clampStep(state.intakeStep);
  const q = QUESTIONS[step];
  const last = step === QUESTIONS.length - 1;
  const id = `intake-${q.field}`;
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  // Next stays enabled: validation runs on click so the failure is announced
  // instead of silently disabling an unfocusable button.
  const [error, setError] = React.useState<string | null>(null);

  // Keyboard and screen-reader users follow the wizard instead of being left
  // at the old Next button.
  React.useEffect(() => {
    headingRef.current?.focus();
    setError(null);
  }, [step]);

  const setField = (
    field: keyof Answers,
    value: Answers[keyof Answers],
  ): void => {
    setError(null);
    dispatch({ type: "SET_FIELD", field, value });
    setDraft({ intake: { ...state.intake, [field]: value }, step });
  };

  const goto = (next: number): void => {
    dispatch({ type: "STEP_GOTO", step: next });
    setDraft({ intake: state.intake, step: next });
  };

  const toggleChannel = (channel: string, on: boolean): void => {
    const current = state.intake.channels;
    let next: string[];
    if (channel === NONE) next = on ? [NONE] : [];
    else if (on) next = [...current.filter((c) => c !== NONE), channel];
    else next = current.filter((c) => c !== channel);
    setField("channels", next);
  };

  const numberValue = (v: number | null): string =>
    v === null ? "" : String(v);
  const parseNumber = (v: string): number | null =>
    v === "" ? null : Number(v);

  const errorId = `${id}-error`;
  const describedBy =
    [q.helper ? `${id}-help` : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;
  const invalid = error ? true : undefined;

  return (
    <div>
      <div className="mb-2.5 flex justify-between gap-4 font-mono text-[length:var(--text-mono-label)] font-semibold tracking-[0.06em] text-ink-soft uppercase">
        <span>
          Step {step + 1} of {QUESTIONS.length}
        </span>
        <span className="text-right">{q.short}</span>
      </div>

      <div
        role="progressbar"
        aria-label="Intake progress"
        aria-valuemin={1}
        aria-valuemax={QUESTIONS.length}
        aria-valuenow={step + 1}
        className="mb-10 flex gap-1.5"
      >
        {QUESTIONS.map((item, i) => (
          <span
            key={item.field}
            className="h-1 flex-1 rounded-[3px]"
            style={{ background: segmentBackground(i, step) }}
          />
        ))}
      </div>

      <h2
        id={`${id}-label`}
        ref={headingRef}
        tabIndex={-1}
        className="mb-7 text-[1.5rem] leading-[1.2] outline-none focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
      >
        {step === 5 ? (
          q.label
        ) : (
          <Label
            htmlFor={id}
            className="cursor-pointer text-[1.5rem] leading-[1.2] font-semibold"
          >
            {q.label}
          </Label>
        )}
      </h2>

      {step === 0 && (
        <Input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          value={state.intake.sell}
          onChange={(e) => setField("sell", e.target.value)}
        />
      )}

      {step === 1 && (
        <Input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          value={state.intake.buyer}
          onChange={(e) => setField("buyer", e.target.value)}
        />
      )}

      {step === 2 && (
        <Input
          id={id}
          placeholder="e.g. Riga"
          aria-describedby={describedBy}
          aria-invalid={invalid}
          value={state.intake.region}
          onChange={(e) => setField("region", e.target.value)}
        />
      )}

      {step === 3 && (
        <Input
          id={id}
          type="number"
          min={0}
          required
          aria-describedby={describedBy}
          aria-invalid={invalid}
          value={numberValue(state.intake.budget)}
          onChange={(e) => setField("budget", parseNumber(e.target.value))}
        />
      )}

      {step === 4 && (
        <Input
          id={id}
          type="number"
          min={1}
          max={40}
          required
          aria-describedby={describedBy}
          aria-invalid={invalid}
          value={numberValue(state.intake.hours)}
          onChange={(e) => setField("hours", parseNumber(e.target.value))}
        />
      )}

      {step === 5 && (
        <div
          role="group"
          aria-labelledby={`${id}-label`}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className="grid gap-2.5 sm:grid-cols-2"
        >
          {CHANNELS.map((c) => {
            const cid = `intake-channel-${c.replace(/\W+/g, "-").toLowerCase()}`;
            return (
              <Label
                key={c}
                htmlFor={cid}
                className="min-h-11 cursor-pointer gap-3 rounded-[var(--radius-input)] border border-line bg-card px-4 py-3 text-[0.90625rem] font-normal has-data-checked:border-violet has-data-checked:bg-[color-mix(in_oklab,var(--violet)_5%,transparent)]"
              >
                <Checkbox
                  id={cid}
                  checked={state.intake.channels.includes(c)}
                  onCheckedChange={(v) => toggleChannel(c, v === true)}
                />
                {c}
              </Label>
            );
          })}
        </div>
      )}

      {step === 6 && (
        <Textarea
          id={id}
          rows={4}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          value={state.intake.goal}
          onChange={(e) => setField("goal", e.target.value)}
        />
      )}

      {step === 7 && (
        <Textarea
          id={id}
          rows={8}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          value={state.intake.voiceSamples}
          onChange={(e) => setField("voiceSamples", e.target.value)}
        />
      )}

      {q.helper && (
        <p
          id={`${id}-help`}
          className="mt-[7px] text-[length:var(--text-xs)] text-ink-soft"
        >
          {q.helper}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-2.5 text-[length:var(--text-sm)] text-destructive"
        >
          {error}
        </p>
      )}

      <div className="mt-9 flex items-center justify-between gap-4 border-t border-line pt-6">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={step === 0}
          onClick={() => goto(step - 1)}
        >
          <span aria-hidden="true">←</span> Back
        </button>
        <button
          type="button"
          className="btn btn-grad"
          onClick={() => {
            if (!isValid(step, state.intake)) {
              setError(errorFor(step));
              // Step 5 is a checkbox group with no element carrying `id`.
              document.getElementById(id)?.focus();
              return;
            }
            if (last) dispatch({ type: "SUBMIT_INTAKE" });
            else goto(step + 1);
          }}
        >
          {last ? "Create my campaign" : "Next"}{" "}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
