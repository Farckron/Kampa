import { expect, test } from "@playwright/test";

// Tier-1 guards from CLAUDE.md: landing pages ship zero client JS and make
// zero third-party requests. These must fail loudly, not drift.

// Relative to baseURL, which carries the site base path.
const PAGES = [".", "faq", "samples/riga-coffee-shop"];

test("landing pages ship no executable scripts", async ({ request }) => {
  for (const path of PAGES) {
    const html = await (await request.get(path)).text();
    // JSON-LD is data, not executed JS — it is the only <script> allowed.
    for (const tag of html.match(/<script[^>]*>/gi) ?? []) {
      expect(tag, `${path} ships an executable script`).toContain(
        "application/ld+json",
      );
    }
  }
});

test("landing pages make no third-party requests", async ({
  page,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin;

  for (const path of PAGES) {
    const urls: string[] = [];
    const collect = (req: { url(): string }) => urls.push(req.url());
    page.on("request", collect);

    await page.goto(path, { waitUntil: "networkidle" });
    page.off("request", collect);

    expect(urls.length, `${path} requested nothing`).toBeGreaterThan(0);
    expect(urls.filter((u) => !u.startsWith(origin))).toEqual([]);
  }
});
