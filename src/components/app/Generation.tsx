import * as React from "react";

import { CheckIcon } from "@/components/ui/icons";
import { estimateEur } from "@/lib/cost";
import { checkBudget, checkHours } from "./engine";
import { MODELS, type GenStage } from "./types";
import { useWizard } from "./WizardContext";

type Status = "pending" | "running" | "done" | "stale";

const STAGES: { id: GenStage; label: string; desc: string }[] = [
  {
    id: "strategy",
    label: "Strategy",
    desc: "Positioning, ideal customer, channel picks and budget split.",
  },
  {
    id: "calendar",
    label: "Calendar",
    desc: "Four weeks of posts and assets, with the time each one takes.",
  },
  {
    id: "copy",
    label: "Copy",
    desc: "Ready-to-post copy in your voice for every calendar item.",
  },
];

const STATUS_TEXT: Record<Status, string> = {
  pending: "Not generated yet",
  running: "Generating…",
  done: "Done",
  stale: "Out of date — regenerate",
};

/** Mockup's fetch-list tick: numbered while waiting, gradient check once done. */
function Tick({ status, step }: { status: Status; step: number }) {
  if (status === "running")
    return (
      <span
        aria-hidden="true"
        className="border-line border-t-violet inline-block size-5 animate-spin rounded-full border-2"
      />
    );
  if (status === "done")
    return (
      <span
        aria-hidden="true"
        className="inline-flex size-5 items-center justify-center rounded-full bg-[image:var(--grad-strong)] text-white"
      >
        <CheckIcon className="size-3" />
      </span>
    );
  if (status === "stale")
    return (
      <span
        aria-hidden="true"
        className="border-coral-ink text-coral-ink inline-flex size-5 items-center justify-center rounded-full border font-mono text-[11px] leading-none font-semibold"
      >
        !
      </span>
    );
  return (
    <span
      aria-hidden="true"
      className="border-line text-ink-soft inline-flex size-5 items-center justify-center rounded-full border font-mono text-[11px] leading-none font-semibold"
    >
      {step}
    </span>
  );
}

/** Raw model output as it arrives. Scrolls itself to the tail. */
function Preview({ text }: { text: string }) {
  const ref = React.useRef<HTMLPreElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [text]);

  return (
    <pre
      ref={ref}
      data-testid="stream-preview"
      className="bg-paper-dim text-ink-soft max-h-40 overflow-y-auto rounded-[var(--radius-input)] p-3.5 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap"
    >
      {text}
    </pre>
  );
}

export function Generation({
  runStage,
  preview = "",
}: {
  runStage: (s: GenStage) => void;
  preview?: string;
}) {
  const { state, dispatch } = useWizard();
  const { campaign, stale, running, intake } = state;

  // ponytail: derived, not mirrored into state — a useEffect+setState copy of
  // props is the classic React footgun and renders one frame stale.
  const warning: Partial<Record<GenStage, string>> = {};
  const budget = campaign.strategy && checkBudget(campaign.strategy, intake);
  const hours = campaign.calendar && checkHours(campaign.calendar, intake);
  if (budget) warning.strategy = budget;
  if (hours) warning.calendar = hours;

  const statusOf = (id: GenStage): Status => {
    if (running === id) return "running";
    if (campaign[id] === null) return "pending";
    return stale[id] ? "stale" : "done";
  };

  const unlocked = (id: GenStage) =>
    id === "strategy"
      ? true
      : id === "calendar"
        ? campaign.strategy !== null
        : campaign.calendar !== null;

  const allDone =
    campaign.strategy !== null &&
    campaign.calendar !== null &&
    campaign.copy !== null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-ink-soft text-[length:var(--text-sm)]">
          Generate each part in order. You can change your answers at any time.
        </p>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={running !== null}
          onClick={() => dispatch({ type: "START_INTAKE" })}
        >
          Edit answers
        </button>
      </div>

      <div className="card flex flex-wrap items-center gap-2.5 p-4">
        <span className="mono-label mb-0" id="gen-model-label">
          Model
        </span>
        <div
          role="group"
          aria-labelledby="gen-model-label"
          className="flex flex-wrap gap-2"
        >
          {MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={running !== null}
              aria-pressed={state.model === m.id}
              title={`${m.blurb} — €${m.inPerMTok}/€${m.outPerMTok} per million tokens`}
              onClick={() => dispatch({ type: "SET_MODEL", model: m.id })}
              className="chip-toggle disabled:pointer-events-none disabled:opacity-50"
            >
              {m.label.replace(" (recommended)", "")}
            </button>
          ))}
        </div>
        <span className="text-ink-soft text-[length:var(--text-xs)]">
          Applies to the next stage you generate.
        </span>
      </div>

      {STAGES.map(({ id, label, desc }, i) => {
        const status = statusOf(id);
        const pending = status === "pending";
        const estimate = estimateEur(state.model, id).toFixed(2);
        return (
          <section
            key={id}
            className="card p-[22px_24px]"
            aria-labelledby={`stage-${id}-title`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <span className="mt-0.5">
                  <Tick status={status} step={i + 1} />
                </span>
                <div>
                  <h2
                    id={`stage-${id}-title`}
                    className="text-[length:var(--text-h3)] leading-snug"
                  >
                    {label}
                  </h2>
                  <p className="text-ink-soft mt-1.5 text-[length:var(--text-sm)] leading-relaxed">
                    {desc}
                  </p>
                  <p className="text-ink-soft mt-2.5 font-mono text-[length:var(--text-mono-label)] font-semibold tracking-[0.06em] uppercase">
                    {STATUS_TEXT[status]} · ~€{estimate} estimate
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={
                  "btn btn-sm shrink-0 " + (pending ? "btn-grad" : "btn-ghost")
                }
                disabled={running !== null || !unlocked(id)}
                onClick={() => runStage(id)}
              >
                {pending ? "Generate" : "Regenerate"}
              </button>
            </div>

            {status === "running" && (
              <div className="border-line mt-4 border-t pt-4">
                {/* The live region announces the stage only. The preview is
                    aria-hidden: it changes on every streamed token, and inside
                    a live region that re-announces the raw model output for the
                    whole generation. */}
                <span role="status" aria-live="polite" className="sr-only">
                  Generating {label}
                </span>
                <div aria-hidden="true" className="space-y-2">
                  {preview === "" ? (
                    <>
                      <div className="bg-paper-dim h-3 w-full animate-pulse rounded" />
                      <div className="bg-paper-dim h-3 w-5/6 animate-pulse rounded" />
                      <div className="bg-paper-dim h-3 w-2/3 animate-pulse rounded" />
                    </>
                  ) : (
                    <Preview text={preview} />
                  )}
                </div>
              </div>
            )}

            {warning[id] !== undefined && status !== "running" && (
              <div className="mt-4 flex bg-[var(--coral-tint)] flex-col gap-3 rounded-[var(--radius-input)] border border-[color-mix(in_oklab,var(--coral)_45%,transparent)] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-coral-ink text-[length:var(--text-sm)]">
                  {warning[id]}
                </p>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm shrink-0"
                  disabled={running !== null}
                  onClick={() => runStage(id)}
                >
                  Regenerate
                </button>
              </div>
            )}
          </section>
        );
      })}

      {allDone && (
        <button
          type="button"
          className="btn btn-grad w-full"
          onClick={() => dispatch({ type: "TO_RESULT" })}
        >
          View my campaign
        </button>
      )}
    </div>
  );
}
