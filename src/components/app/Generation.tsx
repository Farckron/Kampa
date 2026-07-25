import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import { costEur, USAGE } from "./mock";
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

export function Generation({ runStage }: { runStage: (s: GenStage) => void }) {
  const { state, dispatch } = useWizard();
  const { campaign, stale, running } = state;

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
        const estimate = costEur(
          state.model,
          USAGE[id].tokensIn,
          USAGE[id].tokensOut,
        ).toFixed(2);
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
                <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-neutral-100" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-100" />
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
