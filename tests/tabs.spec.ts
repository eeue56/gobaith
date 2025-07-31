import { test } from "./fixtures";
import { expectActiveTab } from "./helpers";

test("the user can switch to the importer tab", async ({ context, page }) => {
  await page.locator('.tab:text("Importer")').click();

  await expectActiveTab(page, "Importer");
});

test("the user can switch to the graphs tab", async ({ context, page }) => {
  await page.locator('.tab:text("Graphs")').click();

  await expectActiveTab(page, "Graphs");
});

test("the user can switch to the settings tab", async ({ context, page }) => {
  await page.locator('.tab:text("Settings")').click();

  await expectActiveTab(page, "Settings");
});
