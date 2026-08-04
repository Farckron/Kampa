import { useWizard } from "./WizardContext";

const fmt = (n: number) => (n < 1000 ? String(n) : `${(n / 1000).toFixed(1)}k`);

export function CostMeter() {
  const { state } = useWizard();
  if (state.demo) return null;

  return (
    <aside
      aria-label="Session usage"
      className="card mt-8 w-full max-w-[17rem] p-4 print:hidden"
    >
      <p className="mono-label mb-0">This session</p>
      <p aria-live="polite" className="mt-1.5 flex items-baseline gap-1.5">
        <span className="font-display text-[1.25rem] leading-none font-bold tracking-[-0.02em]">
          €{state.costEur.toFixed(2)}
        </span>
        <span className="font-mono text-[length:var(--text-xs)] text-ink-soft tabular-nums">
          {fmt(state.tokensIn)} in · {fmt(state.tokensOut)} out
        </span>
      </p>
      <p className="mt-2 text-[length:var(--text-xs)] leading-snug text-ink-soft">
        Real usage, billed by Anthropic to your key.
      </p>
    </aside>
  );
}
