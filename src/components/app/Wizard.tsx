import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ApiError } from "@/lib/anthropic";

import { CostMeter } from "./CostMeter";
import { demoCampaign } from "./demo-campaign";
import { runStageReal } from "./engine";
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
    <header className="border-b border-neutral-200 print:hidden">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-6">
        <a
          href={base}
          className="text-xl font-bold tracking-tight text-neutral-950 lowercase"
        >
          kampa
        </a>
        <div className="flex items-center gap-3">
          {model && <Badge variant="outline">{model.label}</Badge>}
          {/* Present in every key-mode phase so it never looks like the key
              silently vanished; disabled rather than hidden when there is
              nothing to clear. */}
          {!state.demo && (
            <Button
              variant="outline"
              size="sm"
              disabled={!state.keyPresent}
              title="Clear the stored API key from this browser"
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

function ErrorBanner({
  error,
  onDismiss,
}: {
  error: ApiError;
  onDismiss: () => void;
}) {
  const { dispatch } = useWizard();
  const [left, setLeft] = React.useState(error.retryAfterSec ?? 0);

  React.useEffect(() => {
    setLeft(error.retryAfterSec ?? 0);
    if (error.retryAfterSec === undefined) return;
    const t = setInterval(() => setLeft((n) => (n > 0 ? n - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [error]);

  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-destructive bg-destructive/5 p-4"
    >
      <p className="text-sm text-neutral-900">{error.userMessage}</p>
      {error.retryAfterSec !== undefined && (
        <p className="mt-1 text-sm text-neutral-600 tabular-nums">
          {left > 0 ? `Try again in ${left}s.` : "You can try again now."}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        {error.kind === "auth" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              storage.clearKey();
              onDismiss();
              dispatch({ type: "TO_GATE" });
            }}
          >
            Re-enter key
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}

function Shell() {
  const { state, dispatch } = useWizard();
  const [error, setError] = React.useState<ApiError | null>(null);
  const [preview, setPreview] = React.useState("");

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

  // Demo mode never touches the network: it replays the bundled fixture.
  const runStage = (stage: GenStage) => {
    if (state.demo) {
      mockRunStage(dispatch, stage, state.model);
      return;
    }
    setError(null);
    setPreview("");
    void runStageReal(dispatch, stage, {
      intake: state.intake,
      model: state.model,
      campaign: state.campaign,
      onError: setError,
      onPreview: setPreview,
    });
  };

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        {/* The design has no visible page title, but the document still needs
            one h1 above the h2s each phase renders. */}
        <h1 className="sr-only">Kampa campaign wizard</h1>
        {state.phase === "gate" && <Gate />}
        {state.phase === "intake" && <Intake />}
        {state.phase === "generation" && (
          <>
            {error && (
              <ErrorBanner error={error} onDismiss={() => setError(null)} />
            )}
            <Generation runStage={runStage} preview={preview} />
          </>
        )}
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
