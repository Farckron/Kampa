import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <p className="py-10 text-center text-sm text-muted-foreground">
      No {what} yet.
    </p>
  );
}

function SectionHeader({ title, stage }: { title: string; stage: GenStage }) {
  const { state, dispatch } = useWizard();
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="font-heading text-lg font-medium">{title}</h2>
      {!state.demo && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            dispatch({ type: "REGENERATE", stage });
            dispatch({ type: "BACK_TO_GENERATION" });
          }}
        >
          Regenerate
        </Button>
      )}
    </div>
  );
}

function StrategyTab({ strategy }: { strategy: Strategy | null }) {
  if (!strategy) return <Empty what="strategy" />;
  const total = strategy.budgetSplit.reduce((sum, b) => sum + b.eur, 0);

  return (
    <div className="space-y-8">
      <SectionHeader title="Strategy" stage="strategy" />

      <p className="text-base leading-relaxed">{strategy.positioning}</p>

      <Card>
        <CardHeader>
          <CardTitle>Who this is for</CardTitle>
        </CardHeader>
        <CardContent className="leading-relaxed text-muted-foreground">
          {strategy.icp}
        </CardContent>
      </Card>

      <section>
        <h3 className="mb-3 text-sm font-medium">Chosen channels</h3>
        <ul className="space-y-3">
          {strategy.chosen.map((c) => (
            <li key={c.channel} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
              />
              <p className="leading-relaxed">
                <span className="font-medium">{c.channel}</span> — {c.reason}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          Rejected
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {strategy.rejected.map((c) => (
            <li key={c.channel} className="leading-relaxed">
              <span className="font-medium">{c.channel}</span> — {c.reason}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium">Budget split</h3>
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Item</th>
                <th className="px-4 py-2 text-right font-medium">EUR</th>
              </tr>
            </thead>
            <tbody>
              {strategy.budgetSplit.map((b) => (
                <tr key={b.item} className="border-b border-neutral-200">
                  <td className="px-4 py-2">{b.item}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {euro(b.eur)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-medium">
                <td className="px-4 py-2">Total</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {euro(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium">What to measure</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {strategy.kpis.map((k) => (
            <Card key={k.name} size="sm">
              <CardHeader>
                <CardTitle>{k.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>{k.target}</p>
                <p className="text-muted-foreground">{k.where}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

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
      <SectionHeader title="12-week calendar" stage="calendar" />
      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full min-w-[42rem] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-muted-foreground">
              <th className="px-4 py-2 font-medium">Week</th>
              <th className="px-4 py-2 font-medium">Channel</th>
              <th className="px-4 py-2 font-medium">Asset</th>
              <th className="px-4 py-2 font-medium">Working title</th>
              <th className="px-4 py-2 text-right font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={`${r.week}-${r.channel}-${r.title}`}
                className={
                  // month break: heavier rule every 4 weeks
                  i > 0 && r.week % 4 === 1 && rows[i - 1]!.week !== r.week
                    ? "border-t border-neutral-300"
                    : "border-t border-neutral-100"
                }
              >
                <td className="px-4 py-2 tabular-nums">{r.week}</td>
                <td className="px-4 py-2">{r.channel}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {r.assetType}
                </td>
                <td className="px-4 py-2">{r.title}</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {r.minutes} min
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {totalHours.toFixed(1)} hours over {weeks} weeks (
        {(totalHours / weeks).toFixed(1)} h/week)
        {hours !== null && ` — you said you have ${hours} h/week.`}
      </p>
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
    <div className="flex items-center gap-2 print:hidden">
      {result === "failed" && (
        <span className="text-xs text-muted-foreground">
          Select and copy manually
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          void copyText(body).then((ok) => {
            setResult(ok ? "copied" : "failed");
            setTimeout(() => setResult("idle"), 2500);
          });
        }}
      >
        {result === "copied" ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function CopyTab({ copy }: { copy: CopyAsset[] | null }) {
  if (!copy || copy.length === 0) return <Empty what="copy" />;
  const weeks = [...new Set(copy.map((a) => a.week))].sort((a, b) => a - b);

  return (
    <div>
      <SectionHeader title="Copy" stage="copy" />
      <div className="space-y-8">
        {weeks.map((week) => (
          <section key={week}>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Week {week}
            </h3>
            <div className="space-y-3">
              {copy
                .filter((a) => a.week === week)
                .map((a) => (
                  <Card key={`${a.week}-${a.channel}-${a.title}`}>
                    <CardHeader className="grid-cols-[1fr_auto] items-center">
                      <div className="space-y-1">
                        <Badge variant="outline">{a.channel}</Badge>
                        <CardTitle>{a.title}</CardTitle>
                      </div>
                      <CopyButton body={a.body} />
                    </CardHeader>
                    <CardContent className="text-sm leading-relaxed whitespace-pre-wrap">
                      {a.body}
                    </CardContent>
                  </Card>
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
    <div className="space-y-8">
      <h2 className="font-heading text-lg font-medium">Export</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Markdown (.md)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The whole plan as one text file — strategy, calendar and copy —
              ready to paste into Notion, Obsidian or a doc.
            </p>
            <span title={incomplete} className="inline-block">
              <Button
                size="sm"
                disabled={incomplete !== undefined}
                onClick={downloadMarkdown}
              >
                Download .md
              </Button>
            </span>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>PDF (print)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              A print-friendly layout you can hand to a co-founder or a client
              without them needing an account.
            </p>
            <span title={incomplete} className="inline-block">
              <Button
                size="sm"
                disabled={incomplete !== undefined}
                onClick={() => window.print()}
              >
                Print / save as PDF
              </Button>
            </span>
            <p className="text-xs text-muted-foreground">
              Use your browser&rsquo;s Save as PDF.
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Calendar (.ics)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
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
              <p className="text-xs text-muted-foreground">
                Any date you pick snaps back to the Monday of that week.
              </p>
            </div>
            <span title={incomplete} className="inline-block">
              <Button
                size="sm"
                disabled={incomplete !== undefined}
                onClick={downloadIcs}
              >
                Download .ics
              </Button>
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="border-t border-neutral-200 pt-6">
        <h3 className="mb-1 text-sm font-medium">Start over</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Clears this plan, your answers and the stored key from this browser.
        </p>
        <Button
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={() => {
            if (!window.confirm("Delete this plan and start over?")) return;
            clearAll();
            dispatch({ type: "RESET" });
          }}
        >
          Start over
        </Button>
      </div>
    </div>
  );
}

export function Result() {
  const { state, dispatch } = useWizard();

  return (
    <div className="space-y-6 print:space-y-0">
      {state.demo && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-sm print:hidden">
          <p>
            This is the demo plan (Riga coffee shop). Your own plan takes ~15
            minutes.
          </p>
          <Button size="sm" onClick={() => dispatch({ type: "RESET" })}>
            Start with my key
          </Button>
        </div>
      )}

      <Tabs defaultValue="strategy" className="print:hidden">
        <TabsList>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="copy">Copy</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="strategy" className="pt-6">
          <StrategyTab strategy={state.campaign.strategy} />
        </TabsContent>
        <TabsContent value="calendar" className="pt-6">
          <CalendarTab
            calendar={state.campaign.calendar}
            hours={state.intake.hours}
          />
        </TabsContent>
        <TabsContent value="copy" className="pt-6">
          <CopyTab copy={state.campaign.copy} />
        </TabsContent>
        <TabsContent value="export" className="pt-6">
          <ExportTab />
        </TabsContent>
      </Tabs>

      {/* Print flow: the tabs collapse to one stacked document. */}
      <div className="hidden space-y-10 print:block">
        <div className="border-b border-neutral-300 pb-4">
          <p className="font-heading text-xl font-medium">
            {state.intake.sell || "90-day marketing campaign"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            90-day marketing campaign · {toDateInput(new Date())} · made with
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
