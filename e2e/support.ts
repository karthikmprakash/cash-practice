import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

export const PASSPHRASE = "synthetic-test-passphrase";

export function watch(page: Page) {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 500) problems.push(`${response.status()} ${response.url()}`);
  });
  return problems;
}

export async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

export async function signUpPractice(page: Page, email: string) {
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Avery Lane");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSPHRASE);
  await page.getByRole("button", { name: "Create practice" }).click();
  await expect(page.getByRole("heading", { name: "Business associate agreement" })).toBeVisible();
  await page.getByLabel("National provider identifier").fill("1234567893");
  await page.getByLabel("Tax ID").fill("123456789");
  await page.getByLabel("Time zone").selectOption("UTC");
  await page.getByRole("checkbox", { name: "I accept the business associate agreement" }).check();
  await page.getByRole("button", { name: "Accept and continue" }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
}
