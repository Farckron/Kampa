import { expect, test } from "@playwright/test";

// Structure and copy contract for the landing page. Assertions are about
// order, presence and behaviour — never colours or pixel values.

test.beforeEach(async ({ page }) => {
  await page.goto(".");
});

test("sections appear in the designed order", async ({ page }) => {
  const ids = await page
    .locator("main section[id]")
    .evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(ids).toEqual([
    "who",
    "how-it-works",
    "risk",
    "samples",
    "features",
    "pricing",
    "faq",
  ]);
});

test("carries the mockup's section headlines", async ({ page }) => {
  for (const heading of [
    "Built for the owner who does their own marketing.",
    "Four steps, about fifteen minutes.",
    "See the risk before you spend, not after.",
    "Three businesses, three budgets.",
    "Six decisions that shaped the product.",
    "Fair question. Here's the honest answer.",
    "Everything before you type in an API key.",
    "Plan your next campaign before your coffee gets cold.",
  ]) {
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
});

test("how it works has four steps, risk-checking among them", async ({
  page,
}) => {
  const steps = page.locator("#how-it-works ol > li");
  await expect(steps).toHaveCount(4);
  await expect(steps.nth(2)).toContainText("Check the risks");
});

test("risk check shows a per-channel call for every channel", async ({
  page,
}) => {
  const calls = page.locator("#risk .data-row");
  await expect(calls).toHaveCount(4);
  await expect(calls.filter({ hasText: "Continue" })).toHaveCount(2);
  await expect(calls.filter({ hasText: "Reduce" })).toHaveCount(1);
  await expect(calls.filter({ hasText: "Avoid" })).toHaveCount(1);
});

test("every sample card links to its full plan", async ({ page }) => {
  const cards = page.locator("#samples article");
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) {
    await expect(card).toContainText("Risk check:");
    await expect(
      card.getByRole("link", { name: /Open full sample/ }),
    ).toHaveAttribute("href", /\/samples\/[a-z-]+$/);
  }
});

test("features grid ends on the risk cell", async ({ page }) => {
  const cells = page.locator("#features .card-grid > div");
  await expect(cells).toHaveCount(7);
  await expect(cells.last()).toContainText("Risk-checked before you launch");
});

test("comparison table flags risk as a capability", async ({ page }) => {
  await expect(
    page.getByRole("row", { name: /Flags risk before you spend/ }),
  ).toBeVisible();
  // Wide table scrolls in its own region; the page never scrolls sideways.
  const region = page.getByRole("region", { name: "Comparison table" });
  await expect(region).toHaveCSS("overflow-x", "auto");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("the key-safety answer sits outside the accordion", async ({ page }) => {
  const trust = page.locator("#faq").getByText("Is my API key safe?");
  await expect(trust).toBeVisible();
  expect(await trust.evaluate((el) => !!el.closest("details"))).toBe(false);
  // The remaining five are native <details>, open on click without JS.
  const items = page.locator("#faq details.acc");
  await expect(items).toHaveCount(5);
  await items.first().locator("summary").click();
  await expect(items.first()).toHaveAttribute("open", "");
});

test("the sticky CTA stays off-screen until past the fold", async ({
  page,
}) => {
  const bar = page.locator(".sticky-cta");
  const height = await page.evaluate(() => window.innerHeight);
  expect((await bar.boundingBox())!.y).toBeGreaterThanOrEqual(height);

  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.6));
  await expect
    .poll(async () => (await bar.boundingBox())!.y)
    .toBeLessThan(height);
});

test("the plan is described as 30-day throughout", async ({ page }) => {
  await expect(page.locator("main")).not.toContainText("90-day");
  await expect(page.locator("main")).toContainText("30-day campaign");
});
