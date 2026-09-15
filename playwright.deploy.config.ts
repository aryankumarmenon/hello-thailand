import { defineConfig } from "@playwright/test";

// Smoke checks against a deployed Vercel URL (tests/deploy). Local e2e tests get their own config later.
export default defineConfig({
  testDir: "./tests/deploy",
  reporter: "list",
  retries: 0,
  use: {
    baseURL: process.env.DEPLOY_URL ?? "https://hello-thailand-planner.vercel.app",
  },
});
