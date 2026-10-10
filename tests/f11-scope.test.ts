import fs from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

const BANNED_SOURCE = [
  /clearinghouse/i,
  /eligibility\s*check/i,
  /\bERA\b/,
  /\bEOB\b/,
  /837P/i,
  /claim\s*submission/i,
  /submitClaim/,
];

function files(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return files(full);
    return [full];
  });
}

test("no insurance billing modules exist", () => {
  const paths = [...files("app"), ...files("src")];
  const offenders: string[] = [];
  for (const file of paths) {
    const base = path.basename(file);
    if (/(^|[^a-z])(claims?|clearinghouse|eligibility|era|eob)([^a-z]|$)/i.test(base)) offenders.push(file);
    if (!/\.(tsx?|jsx?|sql|css)$/.test(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const pattern of BANNED_SOURCE) {
      if (pattern.test(text)) offenders.push(`${file} matched ${pattern}`);
    }
  }
  expect(offenders).toEqual([]);
});
