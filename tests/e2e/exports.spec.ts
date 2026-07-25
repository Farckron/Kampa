import { expect, test, type Download } from "@playwright/test";

// Exports, clipboard and keyboard flow. Demo mode is the honest fixture here:
// it carries a full campaign AND its intake, so the files have real content
// without a single request leaving the origin.

const KEY = "sk-ant-test-000000000000000000";

/** Playwright hands back a stream, not a string. */
async function textOf(download: Download): Promise<string> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

async function openExportTab(page: import("@playwright/test").Page) {
  await page.goto("/app?demo=1");
  await page.getByRole("tab", { name: "Export" }).click();
}

test("downloads the campaign as markdown", async ({ page }) => {
  await openExportTab(page);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download .md" }).click(),
  ]);

  expect(download.suggestedFilename()).toBe("kampa-campaign.md");

  const md = await textOf(download);
  expect(md).toContain("# Rīts, a 20-seat speciality coffee shop");
  // a chosen channel, with the reason the strategy gave for it
  expect(md).toContain("**Google Business Profile**");
  // a copy asset body, verbatim
  expect(md).toContain(
    "Half of Miera iela is still shuttered when we grind the first batch",
  );
  expect(md).toContain("## 12-week calendar");
});

test("downloads the calendar as an .ics that starts on the chosen Monday", async ({
  page,
}) => {
  await openExportTab(page);

  // Any date snaps back to the Monday of its week: Thu 2026-08-06 → Mon 08-03.
  const start = page.locator("#ics-start");
  await start.fill("2026-08-06");
  await expect(start).toHaveValue("2026-08-03");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download .ics" }).click(),
  ]);

  expect(download.suggestedFilename()).toBe("kampa-calendar.ics");

  const ics = await textOf(download);
  expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0")).toBe(true);
  expect(ics).toContain("PRODID:-//Kampa//EN");
  expect(ics).toMatch(/\r\nSUMMARY:\[[^\]]+\] /);
  expect(ics).toContain("DTSTART;VALUE=DATE:20260803");
  expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  // every line CRLF-terminated and within the RFC 5545 octet limit
  for (const line of ics.split("\r\n"))
    expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
});

test("copies one asset body to the clipboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/app?demo=1");
  await page.getByRole("tab", { name: "Copy" }).click();

  const first = page.getByRole("button", { name: "Copy", exact: true }).first();
  await first.click();

  await expect(page.getByText("Copied").first()).toBeVisible();
  const clipped = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipped.length).toBeGreaterThan(20);
});

test("keyboard alone walks the intake and focus follows to the next step", async ({
  page,
}) => {
  await page.goto("/app");

  await page.locator("#api-key").fill(KEY);
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 1 hands focus to its own heading, so a keyboard user starts there.
  await expect(
    page.getByRole("heading", { name: "What do you sell?" }),
  ).toBeFocused();

  await page.locator("#intake-sell").fill("Speciality coffee, eat in");
  await page.locator("#intake-sell").focus();
  // Back is disabled on step 1, so one Tab lands on Next.
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Next" })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(
    page.getByRole("heading", { name: "Who buys it?" }),
  ).toBeFocused();
  await expect(page.getByText("Step 2 of 8")).toBeVisible();
});
