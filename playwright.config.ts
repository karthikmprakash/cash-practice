import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const key = Buffer.alloc(32, 7).toString("base64");
const database = path.join(process.cwd(), "data", "e2e.db");

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://127.0.0.1:3210",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx next dev -p 3210",
    url: "http://127.0.0.1:3210",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      DATABASE_PATH: database,
      DATA_ENCRYPTION_KEY: key,
      SESSION_SECRET: "test-session-secret-not-for-production-use",
      RATE_LIMIT_DISABLED: "1",
      VIDEO_ROOM_BASE_URL: "https://meet.jit.si",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

export function resetE2eDatabase() {
  for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(database + suffix, { force: true });
}
