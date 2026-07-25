import { defineConfig } from "@playwright/test";

// e2e runs against a production preview on a dedicated port (4322) so a dev
// server on 4321 can never be picked up by mistake — dev output ships Vite
// client scripts that rightly fail the tier-1 zero-JS guard.
export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://localhost:4322" },
  webServer: {
    command: "npm run build && npm run preview -- --port 4322",
    url: "http://localhost:4322",
    reuseExistingServer: false,
  },
});
