import { expect, test } from "@playwright/test";
import { axe, signUpPractice, watch } from "./support";

test("create a client, book a session, and see it on the calendar and chart", async ({ page }) => {
  const problems = watch(page);
  const email = `solo.${Date.now()}@example.com`;
  await signUpPractice(page, email);
  await page.getByRole("link", { name: "Add a client" }).click();
  await page.getByLabel("Client name").fill("River Sample");
  await page.getByLabel("Email").fill("river.sample@example.com");
  await page.getByLabel("Date of birth").fill("1991-04-02");
  await page.getByLabel("Diagnosis code").fill("F41.1");
  await page.getByRole("button", { name: "Save client" }).click();
  await expect(page.getByRole("heading", { name: "River Sample" })).toBeVisible();
  await page.getByLabel("Session date").fill("2026-06-15");
  await page.getByLabel("Start time").fill("15:00");
  await page.getByLabel("Service code").fill("90837");
  await page.getByLabel("Fee").fill("150.00");
  await page.getByRole("button", { name: "Book session" }).click();
  await expect(page.getByText("90837").first()).toBeVisible();
  await page.goto("/calendar?view=day&date=2026-06-15");
  await expect(page.getByRole("link", { name: "River Sample" })).toBeVisible();
  await axe(page);
  await page.goto("/calendar?view=week&date=2026-06-15");
  await expect(page.getByRole("link", { name: "River Sample" })).toBeVisible();
  await page.getByRole("link", { name: "River Sample" }).click();
  await expect(page.getByRole("heading", { name: "River Sample" })).toBeVisible();
  expect(problems).toEqual([]);
});
