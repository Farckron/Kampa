import type {
  CalendarItem,
  CopyAsset,
  Intake,
  Strategy,
} from "@/components/app/types";
import { budget90 } from "@/lib/prompts/stage1-strategy";

/** Local YYYY-MM-DD. The user picked a local date; keep it that way. */
function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/* ---------------------------------- markdown --------------------------------- */

/** Table cells: pipes break the row, newlines break the table. */
function cell(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
}

function budgetLine(intake: Intake): string {
  if (intake.budget === null) return "Budget not set";
  return `Budget €${budget90(intake)} over 90 days (€${intake.budget}/month)`;
}

export function campaignToMarkdown(
  c: { strategy: Strategy; calendar: CalendarItem[]; copy: CopyAsset[] },
  intake: Intake,
  generatedOn: Date,
): string {
  const { strategy } = c;
  const out: string[] = [];

  out.push(`# ${intake.sell} — 90-day marketing campaign`, "");
  out.push(
    `Generated ${isoDate(generatedOn)} · ${budgetLine(intake)} · ${
      intake.hours === null ? "hours not set" : `${intake.hours} h/week`
    }`,
    "",
  );

  out.push("## Strategy", "");
  out.push("### Positioning", "", strategy.positioning, "");
  out.push("### Who it is for", "", strategy.icp, "");

  out.push("### Channels we run", "");
  for (const ch of strategy.chosen)
    out.push(`- **${ch.channel}**: ${ch.reason}`);
  out.push("");

  out.push("### Channels we skip", "");
  for (const ch of strategy.rejected)
    out.push(`- **${ch.channel}**: ${ch.reason}`);
  out.push("");

  out.push("### Budget split", "", "| Item | EUR |", "| --- | ---: |");
  let total = 0;
  for (const b of strategy.budgetSplit) {
    total += b.eur;
    out.push(`| ${cell(b.item)} | ${b.eur} |`);
  }
  out.push(`| **Total** | **${total}** |`, "");

  out.push(
    "### KPIs",
    "",
    "| KPI | Target | Where to look |",
    "| --- | --- | --- |",
  );
  for (const k of strategy.kpis)
    out.push(`| ${cell(k.name)} | ${cell(k.target)} | ${cell(k.where)} |`);
  out.push("");

  out.push("## 12-week calendar", "");
  out.push("| Week | Channel | Asset | Title | Minutes |");
  out.push("| ---: | --- | --- | --- | ---: |");
  const calendar = [...c.calendar].sort((a, b) => a.week - b.week);
  let month = 0;
  for (const i of calendar) {
    const m = Math.ceil(i.week / 4);
    if (m !== month) {
      month = m;
      out.push(`| **Weeks ${m * 4 - 3}-${m * 4}** | | | | |`);
    }
    out.push(
      `| ${i.week} | ${cell(i.channel)} | ${cell(i.assetType)} | ${cell(i.title)} | ${i.minutes} |`,
    );
  }
  out.push("");

  out.push("## Copy", "");
  const copy = [...c.copy].sort((a, b) => a.week - b.week);
  let week = 0;
  for (const a of copy) {
    if (a.week !== week) {
      week = a.week;
      out.push(`**Week ${week}**`, "");
    }
    out.push(`### [${a.channel}] ${a.title}`, "", a.body, "");
  }

  out.push("---", "");
  out.push("Generated with Kampa — free, browser-only campaign planner.");
  return out.join("\n") + "\n";
}

/* ------------------------------------ ics ------------------------------------ */

/** RFC 5545 §3.3.11 TEXT: backslash, semicolon, comma, newline. */
function escText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/[;,]/g, "\\$&")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 §3.1: fold at 75 octets, continuation lines start with one space. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const dec = new TextDecoder();
  const parts: string[] = [];
  let start = 0;
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // never split a multi-byte sequence: back off past continuation bytes
    while (end < bytes.length && (bytes[end]! & 0xc0) === 0x80) end--;
    parts.push(dec.decode(bytes.subarray(start, end)));
    start = end;
    limit = 74; // the leading space costs one of the 75
  }
  return parts.join("\r\n ");
}

function stamp(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export function campaignToIcs(
  calendar: CalendarItem[],
  startMonday: Date,
): string {
  // ponytail: DTSTAMP is "now" — the contract has no generated-date param and
  // DTSTAMP means "when this iCalendar object was created" anyway.
  const dtstamp = stamp(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kampa//EN",
    "CALSCALE:GREGORIAN",
  ];
  calendar.forEach((i, index) => {
    const day = addDays(startMonday, (i.week - 1) * 7);
    const date = (d: Date) => isoDate(d).replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:kampa-w${i.week}-${index}@kampa`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${date(day)}`,
      `DTEND;VALUE=DATE:${date(addDays(day, 1))}`,
      `SUMMARY:${escText(`[${i.channel}] ${i.title}`)}`,
      `DESCRIPTION:${escText(`${i.assetType} (${i.minutes} minutes)`)}`,
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

/* ---------------------------------- download --------------------------------- */

export function downloadFile(
  filename: string,
  mime: string,
  content: string,
): void {
  if (typeof document === "undefined")
    throw new Error("downloadFile needs a browser");
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
