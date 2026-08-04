import * as React from "react";

import type { ApiError } from "@/lib/anthropic";

import { CostMeter } from "./CostMeter";
import { demoCampaign } from "./demo-campaign";
import { runStageReal } from "./engine";
import { Gate } from "./Gate";
import { Generation } from "./Generation";
import { Intake, stepTitle } from "./Intake";
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

  const sub =
    state.phase === "gate"
      ? "Before you start"
      : state.phase === "intake"
        ? stepTitle(state.intakeStep)
        : state.phase === "generation"
          ? "Building your campaign"
          : "Your campaign";

  return (
    <header className="bar-blur sticky top-0 z-50 h-16 border-b border-line print:hidden">
      <div className="flex h-full items-center justify-between gap-4 px-5 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={base + "favicon.svg"}
            width="22"
            height="22"
            alt=""
            className="shrink-0"
          />
          {/* The bar is 64px tall: the title must never wrap, and the phase
              sub-line is dropped on the narrowest screens rather than
              spilling out of the bar. */}
          <div className="min-w-0">
            <h1 className="truncate text-[1rem] leading-tight">
              Campaign wizard
            </h1>
            <p className="mt-px truncate font-mono text-[0.75rem] text-ink-soft max-[479px]:hidden">
              {sub}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {model && (
            <span className="badge-mono max-sm:hidden">{model.label}</span>
          )}
          {/* Present in every key-mode phase so it never looks like the key
              silently vanished; disabled rather than hidden when there is
              nothing to clear. */}
          {!state.demo && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={!state.keyPresent}
              title="Clear the stored API key from this browser"
              onClick={() => {
                storage.clearKey();
                dispatch({ type: "KEY_CLEARED" });
              }}
            >
              Clear key
            </button>
          )}
          <a className="btn btn-ghost btn-sm" href={base}>
            <span aria-hidden="true">←</span> Back to site
          </a>
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
      className="mb-6 rounded-[var(--radius)] border border-destructive bg-destructive/5 p-[18px_20px]"
    >
      <p className="text-[length:var(--text-body-app)] text-ink">
        {error.userMessage}
      </p>
      {error.retryAfterSec !== undefined && (
        <p className="mt-1 text-[length:var(--text-sm)] text-ink-soft tabular-nums">
          {left > 0 ? `Try again in ${left}s.` : "You can try again now."}
        </p>
      )}
      <div className="mt-3.5 flex flex-wrap gap-2">
        {error.kind === "auth" && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              storage.clearKey();
              onDismiss();
              dispatch({ type: "TO_GATE" });
            }}
          >
            Re-enter key
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onDismiss}
        >
          Dismiss
        </button>
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
      {/* The page h1 lives in the sticky topbar; every phase renders h2s. */}
      {/* The report gets the wide 1180px shell (contract §8.3); every other
          phase is the 640px form column. */}
      <main
        id="main"
        tabIndex={-1}
        className={
          state.phase === "result" ? "wrap pt-9 pb-25" : "wrap-form pt-12 pb-25"
        }
      >
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
