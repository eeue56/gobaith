import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { getActiveTab } from "./helpers";

test("the user can switch to the importer tab", async ({ context, page }) => {
  await page.locator('.tab:text("Importer")').click();

  await expect(await getActiveTab(page)).toBe("Importer");
});

test("the user can switch to the graphs tab", async ({ context, page }) => {
  await page.locator('.tab:text("Graphs")').click();

  await expect(await getActiveTab(page)).toBe("Graphs");
});

test("the user can switch to the settings tab", async ({ context, page }) => {
  await page.locator('.tab:text("Settings")').click();

  await expect(await getActiveTab(page)).toBe("Settings");
});
