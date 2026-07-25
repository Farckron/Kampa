import { expect, test } from "@playwright/test";

// Tier-1 guards from CLAUDE.md: landing pages ship zero client JS and make
// zero third-party requests. These must fail loudly, not drift.

test("landing page ships no script tags", async ({ request }) => {
  const html = await (await request.get("/")).text();
  expect(html.includes("<script")).toBe(false);
});

test("landing page makes no third-party requests", async ({
  page,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin;
  const urls: string[] = [];
  page.on("request", (req) => urls.push(req.url()));

  await page.goto("/", { waitUntil: "networkidle" });

  expect(urls.length).toBeGreaterThan(0);
  expect(urls.filter((u) => !u.startsWith(origin))).toEqual([]);
});
