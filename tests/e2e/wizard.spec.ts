import { expect, test, type Page } from "@playwright/test";

// The wizard is the only page with client JS. Stage 04 generation is mocked, so
// the hard guard here is that nothing ever leaves the origin.

const KEY = "sk-ant-test-000000000000000000";

function watchOffOrigin(page: Page, origin: string): string[] {
  const stray: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith(origin)) stray.push(r.url());
  });
  return stray;
}

test("demo mode renders the finished demo plan", async ({ page, baseURL }) => {
  const stray = watchOffOrigin(page, new URL(baseURL!).origin);

  await page.goto("/app?demo=1", { waitUntil: "networkidle" });

  await expect(page.getByRole("tab", { name: "Strategy" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Calendar" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Copy" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Export" })).toBeVisible();
  await expect(page.getByText("the 90-second coffee stop")).toBeVisible();

  await page.getByRole("tab", { name: "Calendar" }).click();
  await expect(page.getByRole("table")).toBeVisible();

  expect(stray).toEqual([]);
});

test("key → intake → mocked generation → result", async ({ page, baseURL }) => {
  const stray = watchOffOrigin(page, new URL(baseURL!).origin);

  await page.goto("/app");

  await page.locator("#api-key").fill(KEY);
  await page.getByRole("button", { name: "Continue" }).click();

  // 8 intake questions, minimal valid answers.
  await page
    .locator("#intake-sell")
    .fill("Speciality coffee, eat in and take away");
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("#intake-buyer").fill("Office workers walking to work");
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("#intake-region").fill("Riga");
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("#intake-budget").fill("400");
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("#intake-hours").fill("4");
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("#intake-channel-instagram").click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.locator("#intake-goal").fill("More weekday morning regulars");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.locator("#intake-voiceSamples")).toBeVisible();
  await page.getByRole("button", { name: "Create my campaign" }).click();

  const stageSection = (stage: string) =>
    page.locator(`section[aria-labelledby="stage-${stage}-title"]`);

  await stageSection("strategy")
    .getByRole("button", { name: "Generate" })
    .click();
  await expect(stageSection("strategy").getByText("Done ·")).toBeVisible();

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
  await expect(stageSection("strategy").getByText("Done ·")).toBeVisible();

  await backToBudget();
  await expect(page.locator("#intake-budget")).toHaveValue("500");
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Create my campaign" }).click();

  for (const stage of ["calendar", "copy"]) {
    await stageSection(stage).getByRole("button", { name: "Generate" }).click();
    await expect(stageSection(stage).getByText("Done ·")).toBeVisible();
  }

  await expect(page.getByText("€0.80")).toBeVisible();

  await page.getByRole("button", { name: "View my campaign" }).click();
  await expect(page.getByText("the 90-second coffee stop")).toBeVisible();

  expect(stray).toEqual([]);
});

test("clear key returns to the gate", async ({ page }) => {
  await page.goto("/app");

  await page.locator("#api-key").fill(KEY);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("#intake-sell")).toBeVisible();

  await page.getByRole("button", { name: "Clear key" }).click();

  await expect(page.locator("#api-key")).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear key" })).toHaveCount(0);
});
