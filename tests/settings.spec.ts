import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { getActiveTab } from "./helpers";

test("the user adds a pill", async ({ context, page }) => {
  await page.locator('.tab:text("Settings")').click();

  await page.locator("#new-pill-entry").fill("Paracetamol 100mg");
  await page.locator("#add-pill").click();

  await page.locator('.tab:text("Journal")').click();
  await expect((await page.locator(".journal-pill").all()).length).toEqual(1);
  await expect(await page.locator(".journal-pill").first()).toContainText(
    "Paracetamol 100mg"
  );
});

test("the user removes settings (including pills)", async ({
  context,
  page,
}) => {
  await page.locator('.tab:text("Settings")').click();

  await page.locator("#new-pill-entry").fill("Paracetamol 100mg");
  await page.locator("#add-pill").click();

  await page.locator('.tab:text("Journal")').click();
  await expect((await page.locator(".journal-pill").all()).length).toEqual(1);

  await page.locator('.tab:text("Settings")').click();
  await page.locator("#remove-all-settings").click();

  await page.locator('.tab:text("Journal")').click();
  await expect((await page.locator(".journal-pill").all()).length).toEqual(0);
});

test("the user removes app state (including journals)", async ({
  context,
  page,
}) => {
  await page.locator('.tab:text("Settings")').click();

  await page.locator("#remove-app-state").click();
  await expect(await getActiveTab(page)).toBe("Settings");
  await page.locator('.tab:text("Graphs")').click();

  // there should only be one day's worth of bars (today's)
  await expect((await page.locator(".daily-bar").all()).length).toEqual(5);

  // ...and all the bars should be at the default value (1)
  await expect((await page.locator(".daily-bar-1").all()).length).toEqual(5);
});
