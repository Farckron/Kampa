import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CostMeter } from "./CostMeter";
import { demoCampaign } from "./demo-campaign";
import { Gate } from "./Gate";
import { Generation } from "./Generation";
import { Intake } from "./Intake";
import { mockRunStage } from "./mock";
import { Result } from "./Result";
import * as storage from "./storage";
import { MODELS } from "./types";
import type { GenStage, Intake as Answers } from "./types";
import { useWizard, WizardProvider } from "./WizardContext";

const base = import.meta.env.BASE_URL;

function Header() {
  const { state, dispatch } = useWizard();
  const model = MODELS.find((m) => m.id === state.model);

  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-6">
        <a
          href={base}
          className="text-xl font-bold tracking-tight text-neutral-950 lowercase"
        >
          kampa
        </a>
        <div className="flex items-center gap-3">
          {model && <Badge variant="outline">{model.label}</Badge>}
          {state.keyPresent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                storage.clearKey();
                dispatch({ type: "KEY_CLEARED" });
              }}
            >
              Clear key
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function Shell() {
  const { state, dispatch } = useWizard();

  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1") {
      dispatch({ type: "START_DEMO", campaign: demoCampaign });
      return;
    }
    if (storage.getKey() === null) return;

    dispatch({ type: "KEY_SET" });
    const draft = storage.getDraft();
    if (draft !== null) {
      const fields = Object.entries(draft.intake) as [
        keyof Answers,
        Answers[keyof Answers],
      ][];
      for (const [field, value] of fields)
        dispatch({ type: "SET_FIELD", field, value });
      dispatch({ type: "STEP_GOTO", step: draft.step });
    }
    dispatch({ type: "START_INTAKE" });
  }, [dispatch]);

  const runStage = (stage: GenStage) =>
    mockRunStage(dispatch, stage, state.model);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        {state.phase === "gate" && <Gate />}
        {state.phase === "intake" && <Intake />}
        {state.phase === "generation" && <Generation runStage={runStage} />}
        {state.phase === "result" && <Result />}
        {(state.phase === "generation" || state.phase === "result") && (
          <CostMeter />
        )}
      </main>
    </>
  );
}

export default function Wizard() {
  return (
    <WizardProvider>
      <Shell />
    </WizardProvider>
  );
}
