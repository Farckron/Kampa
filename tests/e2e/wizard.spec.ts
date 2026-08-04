import { expect, test, type Page } from "@playwright/test";

// The wizard is the only page with client JS. api.anthropic.com is intercepted
// here and is the ONLY host the app may reach besides its own origin.

const KEY = "sk-ant-test-000000000000000000";
const API = "https://api.anthropic.com/v1/messages";

function watchOffOrigin(
  page: Page,
  origin: string,
  allow: string[] = [],
): string[] {
  const stray: string[] = [];
  page.on("request", (r) => {
    const url = r.url();
    if (url.startsWith(origin)) return;
    if (allow.some((a) => url.startsWith(a))) return;
    stray.push(url);
  });
  return stray;
}

// --- recorded SSE ----------------------------------------------------------

const ev = (type: string, data: object) =>
  `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`;

/** A real streamed reply: usage in message_start, the JSON split over several
 *  text_deltas, output tokens in message_delta. 1000 in / 500 out per call. */
function sseBody(payload: unknown): string {
  const text = JSON.stringify(payload);
  const parts = text.match(/[\s\S]{1,120}/g) ?? [text];
  return (
    ev("message_start", {
      message: {
        usage: {
          input_tokens: 1000,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
      },
    }) +
    ev("content_block_start", { index: 0 }) +
    parts
      .map((p) =>
        ev("content_block_delta", {
          index: 0,
          delta: { type: "text_delta", text: p },
        }),
      )
      .join("") +
    ev("message_delta", {
      delta: { stop_reason: "end_turn" },
      usage: { output_tokens: 500 },
    }) +
    ev("message_stop", {})
  );
}

const STRATEGY = {
  positioning: "The 90-second coffee stop on the way to the office.",
  icp: "Office workers aged 25-45 walking past between 7:30 and 9:00.",
  chosen: [
    { channel: "Instagram", reason: "40 local views a post, 25 minutes each." },
    { channel: "Google Business", reason: "Free, 300 map searches a month." },
  ],
  rejected: [
    { channel: "TikTok", reason: "Four hours a week you do not have." },
    { channel: "Paid search", reason: "400 EUR buys about 50 clicks here." },
    { channel: "Podcast", reason: "Eight hours per episode before editing." },
  ],
  // 400 EUR a month is a 1200 EUR pot over the 90 days
  budgetSplit: [
    { item: "Boosted posts, 36 x 20 EUR", eur: 720 },
    { item: "Loyalty cards printed", eur: 300 },
    { item: "Held back for weeks 9-12", eur: 180 },
  ],
  kpis: [
    {
      name: "Morning cups",
      target: "40 a day by week 12",
      where: "Till tally",
    },
    { name: "Profile views", target: "300 a month", where: "GBP dashboard" },
    {
      name: "Saved posts",
      target: "50 by week 8",
      where: "Instagram insights",
    },
  ],
};

const CALENDAR = Array.from({ length: 12 }, (_, i) => ({
  week: i + 1,
  channel: i % 2 === 0 ? "Instagram" : "Google Business",
  assetType: i % 2 === 0 ? "Reel" : "Google Business post",
  title: `Week ${i + 1}: the morning grind, shot at the counter`,
  minutes: 60,
}));

const COPY_MARK = "Beans go in at six, doors open at seven.";

function copyFor(userText: string) {
  const weeks = (/WEEKS ([\d, ]+)\n/.exec(userText)?.[1] ?? "1")
    .split(", ")
    .map(Number);
  return weeks.map((week) => ({
    week,
    channel: "Instagram",
    title: `Week ${week}: the morning grind, shot at the counter`,
    body: `${COPY_MARK} Week ${week}. [NEEDS YOU: photo of the counter]`,
  }));
}

interface Seen {
  headers: Record<string, string>;
  body: Record<string, any>;
}

/** The whole user message of one request, as the model reads it. */
const sentText = (body: Record<string, any>): string =>
  body.messages[0].content.map((b: { text: string }) => b.text).join("\n\n");

/** Serves strategy, then calendar, then the three copy batches. */
async function interceptApi(page: Page, delayMs = 0): Promise<Seen[]> {
  const seen: Seen[] = [];
  await page.route(API, async (route) => {
    const body = route.request().postDataJSON();
    seen.push({ headers: route.request().headers(), body });
    const n = seen.length;
    const userText = sentText(body);
    const payload =
      n === 1
        ? STRATEGY
        : n === 2
          ? { items: CALENDAR }
          : { assets: copyFor(userText) };
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: sseBody(payload),
    });
  });
  return seen;
}

async function fillIntake(page: Page, budget: string) {
  await page.locator("#api-key").fill(KEY);
  await page.getByRole("button", { name: "Continue" }).click();

  await page
    .locator("#intake-sell")
    .fill("Speciality coffee, eat in and take away");
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("#intake-buyer").fill("Office workers walking to work");
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("#intake-region").fill("Riga");
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("#intake-budget").fill(budget);
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("#intake-hours").fill("4");
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("#intake-channel-instagram").click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("#intake-goal").fill("More weekday morning regulars");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.locator("#intake-voiceSamples")).toBeVisible();
  await page.getByRole("button", { name: "Create my campaign" }).click();
}

/** The result screen keeps a second, display:none copy of the campaign for
 *  the print stylesheet, so on-screen assertions scope to the open tab panel. */
const shown = (page: Page) => page.getByRole("tabpanel");

const stageSection = (page: Page, stage: string) =>
  page.locator(`section[aria-labelledby="stage-${stage}-title"]`);

test("demo mode renders the finished demo plan", async ({ page, baseURL }) => {
  const stray = watchOffOrigin(page, new URL(baseURL!).origin);

  await page.goto("app?demo=1", { waitUntil: "networkidle" });

  await expect(page.getByRole("tab", { name: "Strategy" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Calendar" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Copy" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Export" })).toBeVisible();
  await expect(
    shown(page).getByText("the 90-second coffee stop"),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Calendar" }).click();
  await expect(shown(page).getByRole("table")).toBeVisible();

  expect(stray).toEqual([]);
});

test("key → intake → real generation against an intercepted api → result", async ({
  page,
  baseURL,
}) => {
  const stray = watchOffOrigin(page, new URL(baseURL!).origin, [API]);
  // Slow enough that the streamed preview is on screen between copy batches.
  const seen = await interceptApi(page, 900);

  await page.goto("app");
  await fillIntake(page, "400");

  await stageSection(page, "strategy")
    .getByRole("button", { name: "Generate" })
    .click();
  await expect(
    stageSection(page, "strategy").getByText("Generating…"),
  ).toBeVisible();
  await expect(
    stageSection(page, "strategy").getByText("Done ·"),
  ).toBeVisible();

  // answers stay editable after submitting, without losing generated stages
  const backToBudget = async () => {
    await page.getByRole("button", { name: "Edit answers" }).click();
    for (let i = 0; i < 4; i++)
      await page.getByRole("button", { name: "Back" }).click();
  };
  await backToBudget();
  await expect(page.locator("#intake-budget")).toHaveValue("400");
  await page.locator("#intake-budget").fill("500");
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Create my campaign" }).click();
  await expect(
    stageSection(page, "strategy").getByText("Done ·"),
  ).toBeVisible();

  // the split still sums to 1200, so the raised budget (500 x 3) must be flagged
  await expect(
    stageSection(page, "strategy").getByText("€300 unspent", { exact: false }),
  ).toBeVisible();

  await backToBudget();
  await expect(page.locator("#intake-budget")).toHaveValue("500");
  await page.locator("#intake-budget").fill("400");
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Create my campaign" }).click();
  await expect(
    stageSection(page, "strategy").getByText("unspent", { exact: false }),
  ).toHaveCount(0);

  await stageSection(page, "calendar")
    .getByRole("button", { name: "Generate" })
    .click();
  await expect(
    stageSection(page, "calendar").getByText("Done ·"),
  ).toBeVisible();

  // copy is three sequential calls; batch 1's streamed text is on screen while
  // batch 2 is still in flight, which only happens if onText really renders.
  await stageSection(page, "copy")
    .getByRole("button", { name: "Generate" })
    .click();
  await expect(page.getByTestId("stream-preview")).toContainText(COPY_MARK);
  await expect(stageSection(page, "copy").getByText("Done ·")).toBeVisible();

  // 5 calls x (1000 in / 500 out) on sonnet = 5000 in, 2500 out, €0.05
  await expect(page.getByText("5.0k in · 2.5k out")).toBeVisible();
  await expect(page.getByText("€0.05")).toBeVisible();

  await page.getByRole("button", { name: "View my campaign" }).click();
  await expect(
    shown(page).getByText("the 90-second coffee stop"),
  ).toBeVisible();

  // --- what actually went over the wire ---
  expect(seen).toHaveLength(5);
  for (const { headers, body } of seen) {
    expect(headers["x-api-key"]).toBe(KEY);
    expect(headers["anthropic-version"]).toBe("2023-06-01");
    expect(headers["anthropic-dangerous-direct-browser-access"]).toBe("true");
    expect(headers["content-type"]).toContain("application/json");
    expect(body).not.toHaveProperty("temperature");
    expect(body).not.toHaveProperty("top_p");
    expect(body).not.toHaveProperty("top_k");
    expect(body.stream).toBe(true);
    // no assistant prefill
    expect(body.messages.map((m: { role: string }) => m.role)).toEqual([
      "user",
    ]);
    expect(body.system[0].cache_control).toEqual({ type: "ephemeral" });
    // the intake block is cached too, and it is the same bytes every call
    expect(body.messages[0].content[0]).toEqual({
      type: "text",
      text: expect.stringContaining("Here is the business."),
      cache_control: { type: "ephemeral" },
    });
    expect(body.messages[0].content[0].text).toBe(
      seen[0]!.body.messages[0].content[0].text,
    );
    // never on the task block, which changes every call
    expect(body.messages[0].content.at(-1).cache_control).toBeUndefined();
    expect(body.model).toBe("claude-sonnet-5");
  }
  // stages 2-3 cache the agreed strategy on top of it
  for (const { body } of seen.slice(1)) {
    expect(body.messages[0].content[1].cache_control).toEqual({
      type: "ephemeral",
    });
    expect(body.messages[0].content[1].text).toBe(
      seen[1]!.body.messages[0].content[1].text,
    );
  }
  expect(seen.map((s) => s.body.max_tokens)).toEqual([
    16000, 24000, 24000, 24000, 24000,
  ]);
  expect(
    seen.slice(2).map((s) => /WEEKS ([\d, ]+)\n/.exec(sentText(s.body))?.[1]),
  ).toEqual(["1, 2, 3, 4", "5, 6, 7, 8", "9, 10, 11, 12"]);

  expect(stray).toEqual([]);
});

test("a 401 shows the friendly banner and leaves the stage pending", async ({
  page,
  baseURL,
}) => {
  const stray = watchOffOrigin(page, new URL(baseURL!).origin, [API]);
  await page.route(API, (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        type: "error",
        error: { type: "authentication_error", message: "invalid x-api-key" },
      }),
    }),
  );

  await page.goto("app");
  await fillIntake(page, "400");

  await stageSection(page, "strategy")
    .getByRole("button", { name: "Generate" })
    .click();

  const banner = page.getByRole("alert");
  await expect(banner).toContainText("That key was rejected by Anthropic");
  // never the key, never the raw provider message
  await expect(banner).not.toContainText(KEY);
  await expect(banner).not.toContainText("x-api-key");

  await expect(
    stageSection(page, "strategy").getByText("Not generated yet"),
  ).toBeVisible();
  await expect(
    stageSection(page, "strategy").getByRole("button", { name: "Generate" }),
  ).toBeEnabled();

  await banner.getByRole("button", { name: "Re-enter key" }).click();
  await expect(page.locator("#api-key")).toBeVisible();

  expect(stray).toEqual([]);
});

test("clear key returns to the gate", async ({ page }) => {
  await page.goto("app");

  await page.locator("#api-key").fill(KEY);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("#intake-sell")).toBeVisible();

  await page.getByRole("button", { name: "Clear key" }).click();

  await expect(page.locator("#api-key")).toBeVisible();
  // Still on screen so the key does not look like it silently vanished, but
  // there is nothing left to clear.
  await expect(page.getByRole("button", { name: "Clear key" })).toBeDisabled();
});

test("model is selectable on gate and switchable during generation", async ({
  page,
}) => {
  await page.goto("app");
  const opus = page.getByRole("radio", { name: /Best strategy/ });
  await opus.click();
  await expect(opus).toHaveAttribute("data-state", "checked");
  await expect(page.locator("header")).toContainText("Best strategy");
  // visual feedback: the selected card border carries the accent color, the
  // unselected ones keep the hairline. Compared, not hardcoded — the accent
  // token is a design decision, this test only guards that selection shows.
  const borderOf = (id: string) =>
    page
      .locator(`label[for="${id}"]`)
      .evaluate((el) => getComputedStyle(el).borderColor);
  const [selected, sonnet, haiku] = await Promise.all([
    borderOf("claude-opus-5"),
    borderOf("claude-sonnet-5"),
    borderOf("claude-haiku-4-5"),
  ]);
  // Every unselected card keeps one and the same hairline, and only the
  // selected one departs from it — so the difference is caused by selection,
  // not by one card happening to be styled differently.
  expect(sonnet).toBe(haiku);
  expect(selected).not.toBe(sonnet);

  // through to generation with a fake key, switch model there
  await page.getByLabel("Your Anthropic API key").fill(KEY);
  await page.getByRole("button", { name: "Continue" }).click();
  for (const [label, value] of [
    ["What do you sell?", "Coffee"],
    ["Who buys it?", "Locals"],
    ["Where are your customers?", "Riga"],
    ["Monthly marketing budget (EUR)", "400"],
    ["Hours per week you can spend", "4"],
  ] as const) {
    await page.getByLabel(label).fill(value);
    await page.getByRole("button", { name: "Next" }).click();
  }
  await page.getByText("Instagram", { exact: true }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Your one goal for the next 90 days").fill("Growth");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Create my campaign" }).click();

  const budget = page
    .getByRole("group", { name: "Model" })
    .getByRole("button", {
      name: "Budget",
    });
  await budget.click();
  await expect(budget).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("header")).toContainText("Budget");
});
