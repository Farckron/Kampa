import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

import { setDraft } from "./storage";
import type { Intake as Answers } from "./types";
import { useWizard } from "./WizardContext";

type Question = {
  field: keyof Answers;
  label: string;
  helper?: string;
};

const QUESTIONS: Question[] = [
  { field: "sell", label: "What do you sell?" },
  { field: "buyer", label: "Who buys it?" },
  { field: "region", label: "Where are your customers?" },
  {
    field: "budget",
    label: "Monthly marketing budget (EUR)",
    helper: "The plan covers 90 days, so it spends three months of this.",
  },
  { field: "hours", label: "Hours per week you can spend" },
  { field: "channels", label: "Channels you already use" },
  { field: "goal", label: "Your one goal for the next 90 days" },
  {
    field: "voiceSamples",
    label: "Paste 2-3 samples of your writing (posts, About page)",
    helper:
      "Optional but strongly recommended — this is how the copy ends up sounding like you.",
  },
];

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

export function Intake() {
  const { state, dispatch } = useWizard();
  // A restored draft can carry a step index that no longer exists.
  const step = Math.min(Math.max(state.intakeStep, 0), QUESTIONS.length - 1);
  const q = QUESTIONS[step];
  const last = step === QUESTIONS.length - 1;
  const id = `intake-${q.field}`;
  const headingRef = React.useRef<HTMLDivElement>(null);

  // Keyboard and screen-reader users follow the wizard instead of being left
  // at the old Next button.
  React.useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const setField = (
    field: keyof Answers,
    value: Answers[keyof Answers],
  ): void => {
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

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Progress
          value={((step + 1) / QUESTIONS.length) * 100}
          aria-label={`Step ${step + 1} of ${QUESTIONS.length}`}
        />
        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
          Step {step + 1} of {QUESTIONS.length}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle
            id={`${id}-label`}
            ref={headingRef}
            tabIndex={-1}
            role="heading"
            aria-level={2}
            className="outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {step === 5 ? q.label : <Label htmlFor={id}>{q.label}</Label>}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {step === 0 && (
            <Input
              id={id}
              value={state.intake.sell}
              onChange={(e) => setField("sell", e.target.value)}
            />
          )}

          {step === 1 && (
            <Input
              id={id}
              value={state.intake.buyer}
              onChange={(e) => setField("buyer", e.target.value)}
            />
          )}

          {step === 2 && (
            <Input
              id={id}
              placeholder="e.g. Riga"
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
              value={numberValue(state.intake.hours)}
              onChange={(e) => setField("hours", parseNumber(e.target.value))}
            />
          )}

          {step === 5 && (
            <div
              role="group"
              aria-labelledby={`${id}-label`}
              className="grid gap-3 sm:grid-cols-2"
            >
              {CHANNELS.map((c) => {
                const cid = `intake-channel-${c.replace(/\W+/g, "-").toLowerCase()}`;
                return (
                  <div key={c} className="flex items-center gap-2">
                    <Checkbox
                      id={cid}
                      checked={state.intake.channels.includes(c)}
                      onCheckedChange={(v) => toggleChannel(c, v === true)}
                    />
                    <Label htmlFor={cid} className="font-normal">
                      {c}
                    </Label>
                  </div>
                );
              })}
            </div>
          )}

          {step === 6 && (
            <Textarea
              id={id}
              rows={4}
              value={state.intake.goal}
              onChange={(e) => setField("goal", e.target.value)}
            />
          )}

          {step === 7 && (
            <Textarea
              id={id}
              rows={8}
              value={state.intake.voiceSamples}
              onChange={(e) => setField("voiceSamples", e.target.value)}
            />
          )}

          {q.helper && (
            <p className="text-sm text-muted-foreground">{q.helper}</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={step === 0}
          onClick={() => goto(step - 1)}
        >
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={!isValid(step, state.intake)}
          onClick={() =>
            last ? dispatch({ type: "SUBMIT_INTAKE" }) : goto(step + 1)
          }
        >
          {last ? "Create my campaign" : "Next"}
        </Button>
      </div>
    </div>
  );
}
