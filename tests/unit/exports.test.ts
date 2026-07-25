import { afterEach, describe, expect, it, vi } from "vitest";
import { demoCampaign, demoIntake } from "@/components/app/demo-campaign";
import type { CalendarItem, Intake } from "@/components/app/types";
import { campaignToIcs, campaignToMarkdown, downloadFile } from "@/lib/exports";
import { budget90 } from "@/lib/prompts/stage1-strategy";

const campaign = {
  strategy: demoCampaign.strategy!,
  calendar: demoCampaign.calendar!,
  copy: demoCampaign.copy!,
};

const intake: Intake = {
  sell: "Rīts coffee shop",
  buyer: "People walking to work in Miera iela",
  region: "Riga, Latvia",
  budget: 133,
  hours: 4,
  channels: ["Instagram", "Email"],
  goal: "More weekday morning transactions",
  voiceSamples: "Doors open 07:30.",
};

const GENERATED = new Date(2026, 6, 25, 9, 30); // local 2026-07-25
const MONDAY = new Date(2026, 7, 3); // Mon 2026-08-03

describe("campaignToMarkdown", () => {
  const md = campaignToMarkdown(campaign, intake, GENERATED);

  it("opens with the campaign H1", () => {
    expect(md.split("\n")[0]).toBe(
      "# Rīts coffee shop — 90-day marketing campaign",
    );
  });

  it("states the generated date, budget and hours", () => {
    expect(md).toContain("Generated 2026-07-25");
    expect(md).toContain("€399 over 90 days (€133/month)");
    expect(md).toContain("4 h/week");
  });

  it("names every chosen and rejected channel", () => {
    for (const ch of [
      ...campaign.strategy.chosen,
      ...campaign.strategy.rejected,
    ])
      expect(md).toContain(`**${ch.channel}**`);
  });

  it("closes the budget table with a total row", () => {
    const total = campaign.strategy.budgetSplit.reduce((n, b) => n + b.eur, 0);
    expect(md).toContain(`| **Total** | **${total}** |`);
    for (const b of campaign.strategy.budgetSplit)
      expect(md).toContain(`| ${b.item} | ${b.eur} |`);
  });

  it("keeps the demo split in step with the demo intake's 90-day pot", () => {
    expect(campaignToMarkdown(campaign, demoIntake, GENERATED)).toContain(
      `| **Total** | **${budget90(demoIntake)}** |`,
    );
  });

  it("has the calendar table with monthly grouping rows", () => {
    expect(md).toContain("## 12-week calendar");
    expect(md).toContain("| Week | Channel | Asset | Title | Minutes |");
    expect(md).toContain("| **Weeks 1-4** | | | | |");
    expect(md).toContain("| **Weeks 5-8** | | | | |");
    expect(md).toContain("| **Weeks 9-12** | | | | |");
    for (const i of campaign.calendar)
      expect(md).toContain(`| ${i.week} | ${i.channel} |`);
  });

  it("includes every copy asset heading and body verbatim", () => {
    for (const a of campaign.copy) {
      expect(md).toContain(`### [${a.channel}] ${a.title}`);
      expect(md).toContain(a.body);
    }
  });

  it("ends with the Kampa footer", () => {
    expect(
      md
        .trimEnd()
        .endsWith(
          "Generated with Kampa — free, browser-only campaign planner.",
        ),
    ).toBe(true);
  });
});

describe("campaignToIcs", () => {
  const ics = campaignToIcs(campaign.calendar, MONDAY);
  const lines = ics.split("\r\n");

  it("is a wrapped VCALENDAR", () => {
    expect(
      ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Kampa//EN"),
    ).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("emits one VEVENT per calendar item", () => {
    expect(lines.filter((l) => l === "BEGIN:VEVENT")).toHaveLength(
      campaign.calendar.length,
    );
    expect(lines.filter((l) => l === "END:VEVENT")).toHaveLength(
      campaign.calendar.length,
    );
  });

  it("puts week N on startMonday + (N-1)*7 days", () => {
    const starts = lines.filter((l) => l.startsWith("DTSTART"));
    expect(starts[0]).toBe("DTSTART;VALUE=DATE:20260803");
    expect(starts[1]).toBe("DTSTART;VALUE=DATE:20260810"); // week 2 = +7d
    expect(starts.at(-1)).toBe("DTSTART;VALUE=DATE:20261019"); // week 12 = +77d
  });

  it("has deterministic, unique UIDs", () => {
    const uids = lines.filter((l) => l.startsWith("UID:"));
    expect(uids[0]).toBe("UID:kampa-w1-0@kampa");
    expect(uids[1]).toBe("UID:kampa-w2-1@kampa");
    expect(new Set(uids).size).toBe(campaign.calendar.length);
    expect(
      campaignToIcs(campaign.calendar, MONDAY)
        .split("\r\n")
        .filter((l) => l.startsWith("UID:")),
    ).toEqual(uids);
  });

  it("stamps every event with a UTC DTSTAMP", () => {
    for (const l of lines.filter((l) => l.startsWith("DTSTAMP:")))
      expect(l).toMatch(/^DTSTAMP:\d{8}T\d{6}Z$/);
  });

  it("summarises as [channel] title and describes asset + minutes", () => {
    const item = campaign.calendar[0]!;
    expect(ics).toContain(`SUMMARY:[${item.channel}] `);
    expect(ics.replace(/\r\n /g, "")).toContain(
      `DESCRIPTION:${item.assetType} (${item.minutes} minutes)`,
    );
  });

  it("escapes commas, semicolons, backslashes and newlines", () => {
    const item: CalendarItem = {
      week: 1,
      channel: "Email",
      assetType: "Newsletter",
      title: "Coffee, pastry; then\nwork \\ rest",
      minutes: 30,
    };
    const out = campaignToIcs([item], MONDAY);
    expect(out).toContain(
      "SUMMARY:[Email] Coffee\\, pastry\\; then\\nwork \\\\ rest",
    );
  });

  it("folds every line to 75 octets or fewer", () => {
    const long: CalendarItem = {
      week: 1,
      channel: "Instagram",
      assetType: "Reel",
      title: "Rīts rīta kafijas rituāls ".repeat(6),
      minutes: 45,
    };
    for (const l of campaignToIcs([...campaign.calendar, long], MONDAY).split(
      "\r\n",
    ))
      expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
  });

  it("unfolds back to the original content", () => {
    const long: CalendarItem = {
      week: 3,
      channel: "Instagram",
      assetType: "Reel",
      title: "ā".repeat(90),
      minutes: 45,
    };
    expect(campaignToIcs([long], MONDAY).replace(/\r\n /g, "")).toContain(
      `SUMMARY:[Instagram] ${"ā".repeat(90)}`,
    );
  });
});

describe("downloadFile", () => {
  afterEach(() => vi.restoreAllMocks());

  it("creates a blob URL, clicks a download anchor and revokes the URL", () => {
    const create = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:kampa-test");
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    let clicked: HTMLAnchorElement | null = null;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked = this;
    });

    downloadFile("kampa-campaign.md", "text/markdown", "# hi");

    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.calls[0]![0]).toBeInstanceOf(Blob);
    expect((create.mock.calls[0]![0] as Blob).type).toBe("text/markdown");
    expect(clicked).not.toBeNull();
    expect(clicked!.getAttribute("download")).toBe("kampa-campaign.md");
    expect(clicked!.getAttribute("href")).toBe("blob:kampa-test");
    expect(revoke).toHaveBeenCalledWith("blob:kampa-test");
  });
});
