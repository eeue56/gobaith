import { expect, Page, test } from "@playwright/test";
import { awaitForServiceWorker } from "./helpers";

async function getActiveTab(page: Page): Promise<string> {
  const tabName = await page.locator(".active-tab").first().innerText();
  return tabName;
}

test("it starts on journal page", async ({ context, page }) => {
  const url = "http://localhost:3003";
  await page.goto(url.toString());
  await awaitForServiceWorker(context);

  await expect(
    await page.locator(".current-day").first().innerHTML()
  ).toContain("Today");

  await expect(await getActiveTab(page)).toBe("Journal");
});

test("the user can switch to the importer tab", async ({ context, page }) => {
  const url = "http://localhost:3003";
  await page.goto(url.toString());
  await awaitForServiceWorker(context);

  await page.locator('button:text("Importer")').click();

  await expect(await getActiveTab(page)).toBe("Importer");
});

test("the user can switch to the graphs tab", async ({ context, page }) => {
  const url = "http://localhost:3003";
  await page.goto(url.toString());
  await awaitForServiceWorker(context);

  await page.locator('button:text("Graphs")').click();

  await expect(await getActiveTab(page)).toBe("Graphs");
});

test("the user can switch to the settings tab", async ({ context, page }) => {
  const url = "http://localhost:3003";
  await page.goto(url.toString());
  await awaitForServiceWorker(context);

  await page.locator('button:text("Settings")').click();

  await expect(await getActiveTab(page)).toBe("Settings");
});
