import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { signUpPractice, watch } from "./support";

function sourceOf(dir: string): string {
  if (!fs.existsSync(dir)) return "";
  return fs.readdirSync(dir, { withFileTypes: true }).map((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceOf(full);
    if (!/\.(tsx?|jsx?)$/.test(entry.name)) return "";
    return fs.readFileSync(full, "utf8");
  }).join("\n");
}

test("each session launches a unique third-party room", async ({ page }) => {
  const problems = watch(page);
  await signUpPractice(page, `video.${Date.now()}@example.com`);
  await page.getByRole("link", { name: "Add a client" }).click();
  await page.getByLabel("Client name").fill("River Sample");
  await page.getByRole("button", { name: "Save client" }).click();
  await page.getByLabel("Session date").fill("2026-06-15");
  await page.getByLabel("Start time").fill("15:00");
  await page.getByRole("button", { name: "Book session" }).click();
  await page.getByLabel("Session date").fill("2026-06-16");
  await page.getByRole("button", { name: "Book session" }).click();
  const rooms = page.getByRole("link", { name: "Open video room" });
  await expect(rooms).toHaveCount(2);
  const urls: string[] = [];
  for (let index = 0; index < 2; index += 1) {
    await rooms.nth(index).click();
    const href = await page.getByRole("link", { name: "Join room" }).getAttribute("href");
    expect(href).toMatch(/^https:\/\/meet\.jit\.si\/cp-[a-f0-9]{64}$/);
    urls.push(href!);
    await page.goBack();
  }
  expect(new Set(urls).size).toBe(2);
  const source = sourceOf("app") + sourceOf("src");
  expect(source).toContain("@daily-co/daily-js");
  expect(source).not.toContain("RTCPeerConnection");
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")) as { dependencies: Record<string, string> };
  expect(pkg.dependencies["@daily-co/daily-js"]).toBeTruthy();
  expect(problems).toEqual([]);
});
