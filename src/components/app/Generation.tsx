import * as React from "react";

import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import { estimateEur } from "@/lib/cost";
import { checkBudget, checkHours } from "./engine";
import type { GenStage } from "./types";
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

function StatusIcon({ status }: { status: Status }) {
  if (status === "running")
    return (
      <span
        aria-hidden="true"
        className="inline-block size-4 animate-spin rounded-full border-2 border-neutral-200 border-t-primary"
      />
    );
  if (status === "done") return <CheckIcon className="size-4 text-primary" />;
  if (status === "stale")
    return (
      <span
        aria-hidden="true"
        className="inline-flex size-4 items-center justify-center rounded-full border border-amber-500 text-[10px] leading-none font-semibold text-amber-600"
      >
        !
      </span>
    );
  return (
    <span
      aria-hidden="true"
      className="inline-block size-4 rounded-full border border-neutral-300"
    />
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
      className="max-h-40 overflow-y-auto rounded-lg bg-neutral-50 p-3 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap text-neutral-600"
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
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-neutral-600">
          Generate each part in order. You can change your answers at any time.
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={running !== null}
          onClick={() => dispatch({ type: "START_INTAKE" })}
        >
          Edit answers
        </Button>
      </div>

      {STAGES.map(({ id, label, desc }) => {
        const status = statusOf(id);
        const pending = status === "pending";
        const estimate = estimateEur(state.model, id).toFixed(2);
        return (
          <section
            key={id}
            className="rounded-xl border border-neutral-200 p-4"
            aria-labelledby={`stage-${id}-title`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5">
                  <StatusIcon status={status} />
                </span>
                <div>
                  <h3
                    id={`stage-${id}-title`}
                    className="text-base leading-snug font-medium"
                  >
                    {label}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-600">{desc}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {STATUS_TEXT[status]} · ~€{estimate} estimate
                  </p>
                </div>
              </div>
              <Button
                variant={pending ? "default" : "outline"}
                size="sm"
                disabled={running !== null || !unlocked(id)}
                onClick={() => runStage(id)}
              >
                {pending ? "Generate" : "Regenerate"}
              </Button>
            </div>

            {status === "running" && (
              <div
                role="status"
                aria-live="polite"
                className="mt-4 space-y-2 border-t border-neutral-200 pt-4"
              >
                <span className="sr-only">Generating {label}</span>
                {preview === "" ? (
                  <>
                    <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
                    <div className="h-3 w-5/6 animate-pulse rounded bg-neutral-100" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-100" />
                  </>
                ) : (
                  <Preview text={preview} />
                )}
              </div>
            )}

            {warning[id] !== undefined && status !== "running" && (
              <div className="mt-4 flex flex-col gap-3 rounded-lg border border-amber-500 bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-amber-900">{warning[id]}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={running !== null}
                  onClick={() => runStage(id)}
                >
                  Regenerate
                </Button>
              </div>
            )}
          </section>
        );
      })}

      {allDone && (
        <Button
          size="lg"
          className="w-full"
          onClick={() => dispatch({ type: "TO_RESULT" })}
        >
          View my campaign
        </Button>
      )}
    </div>
  );
}
