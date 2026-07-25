import { useWizard } from "./WizardContext";

const fmt = (n: number) => (n < 1000 ? String(n) : `${(n / 1000).toFixed(1)}k`);

export function CostMeter() {
  const { state } = useWizard();
  if (state.demo) return null;

  return (
    <aside
      aria-label="Session usage"
      className="mt-8 rounded-xl border border-neutral-200 bg-white p-3 text-xs sm:fixed sm:right-4 sm:bottom-4 sm:z-40 sm:mt-0 sm:w-56"
    >
      <p className="font-medium text-neutral-900">This session</p>
      <p className="mt-1 text-neutral-600">
        {fmt(state.tokensIn)} in · {fmt(state.tokensOut)} out ·{" "}
        <span className="text-neutral-900">€{state.costEur.toFixed(2)}</span>
      </p>
      <p className="mt-1 text-[11px] leading-snug text-neutral-500">
        Real usage, billed by Anthropic to your key.
      </p>
    </aside>
  );
}
