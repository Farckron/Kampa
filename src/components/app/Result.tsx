import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { campaignToIcs, campaignToMarkdown, downloadFile } from "@/lib/exports";
import { clearAll } from "./storage";
import type { CalendarItem, CopyAsset, GenStage, Strategy } from "./types";
import { useWizard } from "./WizardContext";

const euro = (n: number) => `€${n.toLocaleString("en-IE")}`;

function Empty({ what }: { what: string }) {
  return (
    <p className="text-ink-soft py-10 text-center text-sm">No {what} yet.</p>
  );
}

function SectionHeader({ title, stage }: { title: string; stage: GenStage }) {
  const { state, dispatch } = useWizard();
  return (
    <div className="border-line mb-8 flex items-center justify-between gap-4 border-b pb-5">
      <h2 className="font-heading text-[length:var(--text-h2-doc)] leading-tight">
        {title}
      </h2>
      {!state.demo && (
        <button
          type="button"
          className="btn btn-ghost btn-sm shrink-0"
          onClick={() => {
            dispatch({ type: "REGENERATE", stage });
            dispatch({ type: "BACK_TO_GENERATION" });
          }}
        >
          Regenerate
        </button>
      )}
    </div>
  );
}

/** Verdict-banner stat: mono value over a mono label. */
function VStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <b className="block font-mono text-[19px] font-semibold">{value}</b>
      <span className="text-ink-soft text-[10px] tracking-[0.05em] uppercase">
        {label}
      </span>
    </div>
  );
}

function StrategyTab({ strategy }: { strategy: Strategy | null }) {
  if (!strategy) return <Empty what="strategy" />;
  const total = strategy.budgetSplit.reduce((sum, b) => sum + b.eur, 0);
  const share = (eur: number) => (total > 0 ? (eur / total) * 100 : 0);

  return (
    <div className="space-y-10">
      <SectionHeader title="Strategy" stage="strategy" />

      <div className="card flex flex-wrap items-center gap-7 bg-[image:var(--grad-wash)] p-[22px_26px]">
        <p className="min-w-[220px] flex-1 text-[length:var(--text-lead)] leading-relaxed">
          {strategy.positioning}
        </p>
        <div className="flex flex-none gap-7">
          <VStat label="Channels" value={String(strategy.chosen.length)} />
          <VStat label="Rejected" value={String(strategy.rejected.length)} />
          {total > 0 && <VStat label="Budget" value={euro(total)} />}
        </div>
      </div>

      <section className="card p-[22px_24px]">
        <h3 className="mono-label">Who this is for</h3>
        <p className="text-ink-soft leading-relaxed">{strategy.icp}</p>
      </section>

      <section>
        <h3 className="mono-label">Chosen channels</h3>
        <div className="space-y-3.5">
          {strategy.chosen.map((c) => (
            <div key={c.channel} className="card p-[22px_24px]">
              <h4 className="font-heading text-[length:var(--text-h4)]">
                {c.channel}
              </h4>
              <p className="text-ink-soft mt-2 text-[length:var(--text-sm)] leading-relaxed">
                {c.reason}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-[20px_22px]">
        <h3 className="mono-label">Rejected</h3>
        <div>
          {strategy.rejected.map((c) => (
            <div
              key={c.channel}
              className="data-row flex-col items-start gap-1 sm:flex-row sm:items-center"
            >
              <span className="font-semibold">{c.channel}</span>
              <span className="text-ink-soft sm:max-w-[60%] sm:text-right">
                {c.reason}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mono-label">Budget split</h3>
        <div className="card space-y-3.5 p-[22px_24px]">
          {strategy.budgetSplit.map((b) => (
            <div key={b.item} className="bar-row">
              <span>{b.item}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${share(b.eur).toFixed(1)}%` }}
                />
              </div>
              <span className="text-right font-mono font-semibold">
                {euro(b.eur)}
              </span>
            </div>
          ))}
          <div className="border-line mt-1 flex items-center justify-between border-t-2 pt-3.5 text-[length:var(--text-sm)] font-semibold">
            <span>Total</span>
            <span className="font-mono">{euro(total)}</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mono-label">What to measure</h3>
        <div className="card-grid grid-cols-1 sm:grid-cols-2">
          {strategy.kpis.map((k) => (
            <div key={k.name} className="p-[18px_20px]">
              <h4 className="mono-label mb-2">{k.name}</h4>
              <p className="text-[length:var(--text-sm)] font-semibold">
                {k.target}
              </p>
              <p className="text-ink-soft mt-1 text-[length:var(--text-xs)]">
                {k.where}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const TAGS = ["tag-ig", "tag-gbp", "tag-em"] as const;

/** Tag colour is decoration only — the channel name carries the meaning.
 *  Hashing keeps one channel the same colour down the whole calendar. */
const tagClass = (channel: string): string =>
  TAGS[[...channel].reduce((n, ch) => n + ch.charCodeAt(0), 0) % TAGS.length]!;

const TH =
  "text-ink-soft pr-3.5 pb-2.5 text-left font-mono text-[length:var(--text-mono-xs)] font-semibold tracking-[0.06em] uppercase";

function CalendarTab({
  calendar,
  hours,
}: {
  calendar: CalendarItem[] | null;
  hours: number | null;
}) {
  if (!calendar || calendar.length === 0) return <Empty what="calendar" />;
  const rows = [...calendar].sort((a, b) => a.week - b.week);
  const totalHours = rows.reduce((sum, r) => sum + r.minutes, 0) / 60;
  const weeks = Math.max(...rows.map((r) => r.week));

  return (
    <div>
      <SectionHeader title="4-week calendar" stage="calendar" />
      {/* tabindex makes the scroll box reachable by keyboard (Safari won't
          focus a scroll container on its own); the role gives it a name. */}
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="4-week calendar"
      >
        <table className="w-full min-w-[42rem] border-collapse text-[length:var(--text-sm)]">
          <thead>
            <tr>
              <th scope="col" className={TH}>
                Week
              </th>
              <th scope="col" className={TH}>
                Channel
              </th>
              <th scope="col" className={TH}>
                Asset
              </th>
              <th scope="col" className={TH}>
                Working title
              </th>
              <th scope="col" className={TH + " text-right"}>
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={`${r.week}-${r.channel}-${r.title}`}
                className={i === 0 ? "" : "border-line border-t"}
              >
                <td className="py-3 pr-3.5 align-top">
                  <span className="text-ink-soft font-mono font-bold">
                    {r.week}
                  </span>
                </td>
                <td className="py-3 pr-3.5 align-top">
                  <span className={"tag " + tagClass(r.channel)}>
                    {r.channel}
                  </span>
                </td>
                <td className="text-ink-soft py-3 pr-3.5 align-top">
                  {r.assetType}
                </td>
                <td className="py-3 pr-3.5 align-top">{r.title}</td>
                <td className="py-3 text-right align-top font-mono font-semibold">
                  {r.minutes} min
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="callout mt-5">
        {/* one flex item — a bare text node next to an expression would become
            two, and the callout's gap would split the sentence. */}
        <p>
          {totalHours.toFixed(1)} hours over {weeks} weeks (
          {(totalHours / weeks).toFixed(1)} h/week)
          {hours !== null && ` — you said you have ${hours} h/week.`}
        </p>
      </div>
    </div>
  );
}

/**
 * navigator.clipboard is undefined on insecure origins (plain http on a LAN
 * IP), so fall back to the old selection trick before giving up.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard !== undefined) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to execCommand
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.readOnly = true;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

function CopyButton({ body }: { body: string }) {
  const [result, setResult] = React.useState<"idle" | "copied" | "failed">(
    "idle",
  );
  return (
    <div className="flex items-center gap-2.5 print:hidden">
      <span role="status" aria-live="polite">
        {result === "failed" && (
          <span className="text-ink-soft text-[length:var(--text-xs)]">
            Select and copy manually
          </span>
        )}
      </span>
      <button
        type="button"
        className={
          "btn btn-sm shrink-0 " +
          (result === "copied" ? "btn-primary" : "btn-ghost")
        }
        onClick={() => {
          void copyText(body).then((ok) => {
            setResult(ok ? "copied" : "failed");
            setTimeout(() => setResult("idle"), 2500);
          });
        }}
      >
        {result === "copied" ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function CopyTab({ copy }: { copy: CopyAsset[] | null }) {
  if (!copy || copy.length === 0) return <Empty what="copy" />;
  const weeks = [...new Set(copy.map((a) => a.week))].sort((a, b) => a - b);

  return (
    <div>
      <SectionHeader title="Copy" stage="copy" />
      <div className="space-y-9">
        {weeks.map((week) => (
          <section key={week}>
            <h3 className="mono-label">Week {week}</h3>
            <div className="space-y-4">
              {copy
                .filter((a) => a.week === week)
                .map((a) => (
                  <div
                    key={`${a.week}-${a.channel}-${a.title}`}
                    className="card p-[22px_24px]"
                  >
                    <div className="flex items-center justify-between gap-3.5">
                      <div className="min-w-0">
                        <h4 className="font-heading text-[length:var(--text-h4)]">
                          {a.title}
                        </h4>
                        <p className="text-ink-soft mt-1 font-mono text-[length:var(--text-mono-label)] tracking-[0.06em] uppercase">
                          {a.channel} · Week {a.week}
                        </p>
                      </div>
                      <CopyButton body={a.body} />
                    </div>
                    <p className="bg-paper-dim mt-3.5 rounded-[var(--radius-input)] p-[16px_18px] text-[length:var(--text-body-app)] leading-relaxed whitespace-pre-wrap">
                      {a.body}
                    </p>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/** Local-date helpers: `new Date("2026-08-03")` parses as UTC and can land on
 *  the wrong day once the browser shifts it into local time. */
const toDateInput = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

function fromDateInput(s: string): Date | null {
  const [y, m, d] = s.split("-").map(Number);
  if (y === undefined || m === undefined || d === undefined) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Monday of the week the given date falls in. */
function mondayOf(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

function nextMonday(): Date {
  const d = mondayOf(new Date());
  d.setDate(d.getDate() + 7);
  return d;
}

function ExportTab() {
  const { state, dispatch } = useWizard();
  const { strategy, calendar, copy } = state.campaign;
  const [start, setStart] = React.useState(() => toDateInput(nextMonday()));

  const incomplete =
    strategy === null || calendar === null || copy === null
      ? "Generate strategy, calendar and copy first."
      : undefined;

  const downloadMarkdown = (): void => {
    if (strategy === null || calendar === null || copy === null) return;
    downloadFile(
      "kampa-campaign.md",
      "text/markdown",
      campaignToMarkdown(
        { strategy, calendar, copy },
        state.intake,
        new Date(),
      ),
    );
  };

  const downloadIcs = (): void => {
    const startMonday = fromDateInput(start);
    if (calendar === null || startMonday === null) return;
    downloadFile(
      "kampa-calendar.ics",
      "text/calendar",
      campaignToIcs(calendar, mondayOf(startMonday)),
    );
  };

  return (
    <div className="space-y-9">
      <h2 className="font-heading border-line border-b pb-5 text-[length:var(--text-h2-doc)] leading-tight">
        Export
      </h2>
      {/* One visible reason for all three disabled buttons — a `title` needs a
          hover and most screen readers never announce it. */}
      <div role="status">
        {incomplete !== undefined && <p className="callout">{incomplete}</p>}
      </div>
      <div className="grid gap-3.5 sm:grid-cols-3">
        <div className="card flex flex-col gap-3.5 p-[22px_24px]">
          <h3 className="mono-label mb-0">Markdown (.md)</h3>
          <p className="text-ink-soft text-[length:var(--text-sm)] leading-relaxed">
            The whole plan as one text file — strategy, calendar and copy —
            ready to paste into Notion, Obsidian or a doc.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm mt-auto self-start"
            disabled={incomplete !== undefined}
            onClick={downloadMarkdown}
          >
            Download .md
          </button>
        </div>

        <div className="card flex flex-col gap-3.5 p-[22px_24px]">
          <h3 className="mono-label mb-0">PDF (print)</h3>
          <p className="text-ink-soft text-[length:var(--text-sm)] leading-relaxed">
            A print-friendly layout you can hand to a co-founder or a client
            without them needing an account.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm mt-auto self-start"
            disabled={incomplete !== undefined}
            onClick={() => window.print()}
          >
            Print / save as PDF
          </button>
          <p className="text-ink-soft text-[length:var(--text-xs)]">
            Use your browser&rsquo;s Save as PDF.
          </p>
        </div>

        <div className="card flex flex-col gap-3.5 p-[22px_24px]">
          <h3 className="mono-label mb-0">Calendar (.ics)</h3>
          <p className="text-ink-soft text-[length:var(--text-sm)] leading-relaxed">
            Every calendar row as a dated task, so the plan lands in Google
            Calendar instead of a tab you forget.
          </p>
          <div className="space-y-1">
            <Label htmlFor="ics-start">Campaign start (a Monday)</Label>
            <Input
              id="ics-start"
              type="date"
              value={start}
              onChange={(e) => {
                const picked = fromDateInput(e.target.value);
                if (picked !== null) setStart(toDateInput(mondayOf(picked)));
              }}
            />
            <p className="text-ink-soft text-[length:var(--text-xs)]">
              Any date you pick snaps back to the Monday of that week.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm mt-auto self-start"
            disabled={incomplete !== undefined}
            onClick={downloadIcs}
          >
            Download .ics
          </button>
        </div>
      </div>

      <div className="border-line border-t pt-7">
        <h3 className="mono-label mb-1.5">Start over</h3>
        <p className="text-ink-soft mb-3.5 text-[length:var(--text-sm)]">
          Clears this plan, your answers and the stored key from this browser.
        </p>
        <button
          type="button"
          className="btn btn-ghost text-coral-ink border-[color-mix(in_oklab,var(--coral)_45%,transparent)] hover:bg-[var(--coral-tint)]"
          onClick={() => {
            if (!window.confirm("Delete this plan and start over?")) return;
            clearAll();
            dispatch({ type: "RESET" });
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}

/** Report nav: mono/uppercase label, 44px tap target, gradient underline when
 *  active (the `line` variant supplies the ::after bar). */
const TAB =
  "min-h-11 px-4 font-mono text-[length:var(--text-mono-label)] font-semibold tracking-[0.08em] uppercase after:bg-[image:var(--grad)]";

export function Result() {
  const { state, dispatch } = useWizard();

  return (
    <div className="space-y-6 print:space-y-0">
      {state.demo && (
        <div className="callout callout-violet flex-wrap items-center justify-between gap-3.5 print:hidden">
          <p className="text-ink text-[length:var(--text-sm)]">
            This is the demo plan (Riga coffee shop). Your own plan takes ~15
            minutes.
          </p>
          <button
            type="button"
            className="btn btn-grad btn-sm shrink-0"
            onClick={() => dispatch({ type: "RESET" })}
          >
            Start with my key
          </button>
        </div>
      )}

      <Tabs defaultValue="strategy" className="print:hidden">
        {/* h-auto! beats the list's `group-data-horizontal:h-8`, which would
            otherwise cap this nav at 32px. */}
        {/* max-w-full + shrink-0 children: the strip scrolls itself on narrow
            screens instead of widening the whole report. */}
        <TabsList
          variant="line"
          className="h-auto! max-w-full overflow-x-auto [&>*]:shrink-0"
        >
          <TabsTrigger value="strategy" className={TAB}>
            Strategy
          </TabsTrigger>
          <TabsTrigger value="calendar" className={TAB}>
            Calendar
          </TabsTrigger>
          <TabsTrigger value="copy" className={TAB}>
            Copy
          </TabsTrigger>
          <TabsTrigger value="export" className={TAB}>
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="strategy" className="pt-8">
          <StrategyTab strategy={state.campaign.strategy} />
        </TabsContent>
        <TabsContent value="calendar" className="pt-8">
          <CalendarTab
            calendar={state.campaign.calendar}
            hours={state.intake.hours}
          />
        </TabsContent>
        <TabsContent value="copy" className="pt-8">
          <CopyTab copy={state.campaign.copy} />
        </TabsContent>
        <TabsContent value="export" className="pt-8">
          <ExportTab />
        </TabsContent>
      </Tabs>

      {/* Print flow: the tabs collapse to one stacked document. */}
      <div className="hidden space-y-10 print:block">
        <div className="border-line border-b pb-4">
          <p className="font-heading text-xl font-semibold">
            {state.intake.sell || "30-day marketing campaign"}
          </p>
          <p className="text-ink-soft mt-1 font-mono text-[length:var(--text-mono-label)] tracking-[0.06em] uppercase">
            30-day marketing campaign · {toDateInput(new Date())} · made with
            Kampa
          </p>
        </div>
        <StrategyTab strategy={state.campaign.strategy} />
        <CalendarTab
          calendar={state.campaign.calendar}
          hours={state.intake.hours}
        />
        <CopyTab copy={state.campaign.copy} />
      </div>
    </div>
  );
}
