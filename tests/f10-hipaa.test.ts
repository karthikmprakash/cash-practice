import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { clearLogs, logInfo, redact, recentLogs } from "../src/server/logger";
import { sessionCookieOptions, assertProductionTls } from "../src/server/tls";
import { createClient } from "../src/server/clients";
import { practice, removeDb, tempDb } from "./helpers";

test("logger redacts PHI, secrets stay off the client, and production requires TLS", () => {
  clearLogs();
  logInfo("saved chart", { email: "river.sample@example.com", displayName: "River Sample", id: "abc" });
  logInfo("call 555-019-9900 about river.sample@example.com");
  const written = recentLogs().join("\n");
  expect(written).not.toContain("river.sample@example.com");
  expect(written).not.toContain("River Sample");
  expect(written).not.toContain("555-019-9900");
  expect(written).toContain("[redacted]");
  expect(redact("reach me at river.sample@example.com")).not.toContain("@");

  const { db, file } = tempDb();
  const actor = practice(db);
  createClient(db, actor, { displayName: "River Sample", email: "river.sample@example.com", phone: "555-0199" });
  db.pragma("wal_checkpoint(FULL)");
  const raw = fs.readFileSync(file);
  expect(raw.includes(Buffer.from("River Sample"))).toBe(false);
  expect(raw.includes(Buffer.from("river.sample@example.com"))).toBe(false);
  removeDb(file, db);

  execFileSync("node", ["scripts/guard-client-secrets.mjs"], { stdio: "pipe" });
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "cp-secret-"));
  fs.writeFileSync(path.join(fixture, "bad.tsx"), `"use client";\nconst key = process.env.STRIPE_SECRET_KEY;\n`);
  expect(() => execFileSync("node", ["scripts/guard-client-secrets.mjs", fixture], { stdio: "pipe" })).toThrow();
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")) as { scripts: { build: string } };
  expect(pkg.scripts.build).toContain("guard-client-secrets");

  const env = process.env as Record<string, string | undefined>;
  const previous = env.NODE_ENV;
  const phase = env.NEXT_PHASE;
  const https = env.FORCE_HTTPS;
  env.NODE_ENV = "production";
  delete env.NEXT_PHASE;
  delete env.FORCE_HTTPS;
  expect(() => assertProductionTls()).toThrow(/TLS-only/);
  env.FORCE_HTTPS = "1";
  expect(() => assertProductionTls()).not.toThrow();
  expect(sessionCookieOptions(new Date()).secure).toBe(true);
  env.NODE_ENV = previous;
  if (phase === undefined) delete env.NEXT_PHASE;
  else env.NEXT_PHASE = phase;
  if (https === undefined) delete env.FORCE_HTTPS;
  else env.FORCE_HTTPS = https;

  const config = fs.readFileSync("next.config.ts", "utf8");
  expect(config).toContain("Strict-Transport-Security");
  expect(config).toContain("max-age=63072000");

  const staticDir = path.join(".next", "static");
  if (fs.existsSync(staticDir)) {
    const bundle = walk(staticDir);
    expect(bundle).not.toContain("sk_live_");
    expect(bundle).not.toContain("sk_test_");
    expect(bundle).not.toContain(process.env.DATA_ENCRYPTION_KEY ?? "missing-key");
  }
});

function walk(dir: string): string {
  let text = "";
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) text += walk(full);
    else if (fs.statSync(full).size < 2_000_000) text += fs.readFileSync(full, "utf8");
  }
  return text;
}
