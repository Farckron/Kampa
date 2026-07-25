import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function CopyButton({ body }: { body: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        void navigator.clipboard.writeText(body).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? "Copied" : "Copy"}
    </Button>
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

const exportOptions = [
  {
    title: "Markdown (.md)",
    text: "The whole plan as one text file — strategy, calendar and copy — ready to paste into Notion, Obsidian or a doc.",
  },
  {
    title: "PDF (print)",
    text: "A print-friendly layout you can hand to a co-founder or a client without them needing an account.",
  },
  {
    title: "Calendar (.ics)",
    text: "Every calendar row as a dated task, so the plan lands in Google Calendar instead of a tab you forget.",
  },
];

function ExportTab() {
  const { dispatch } = useWizard();
  return (
    <div className="space-y-8">
      <h2 className="font-heading text-lg font-medium">Export</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {exportOptions.map((o) => (
          <Card key={o.title} size="sm">
            <CardHeader>
              <CardTitle>{o.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{o.text}</p>
              <Button size="sm" disabled>
                Download
              </Button>
              <Badge variant="outline">Coming in the next update</Badge>
            </CardContent>
          </Card>
        ))}
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
    <div className="space-y-6">
      {state.demo && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-sm">
          <p>
            This is the demo plan (Riga coffee shop). Your own plan takes ~15
            minutes.
          </p>
          <Button size="sm" onClick={() => dispatch({ type: "RESET" })}>
            Start with my key
          </Button>
        </div>
      )}

      <Tabs defaultValue="strategy">
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
    </div>
  );
}
