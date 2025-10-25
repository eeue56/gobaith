import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { changeTab, expectActiveTab } from "./helpers";

test("the user adds a pill", async ({ context, page }) => {
  await changeTab(page, "SETTINGS");

  await page.locator("#new-pill-entry").fill("Paracetamol 100mg");
  await page.locator("#add-pill").click();

  await changeTab(page, "JOURNAL");
  await expect(await page.locator(".journal-pill")).toHaveCount(1);
  await expect(await page.locator(".journal-pill").first()).toContainText(
    "Paracetamol 100mg"
  );
});

test("the user removes settings (including pills)", async ({
  context,
  page,
}) => {
  await changeTab(page, "SETTINGS");

  await page.locator("#new-pill-entry").fill("Paracetamol 100mg");
  await page.locator("#add-pill").click();

  await changeTab(page, "JOURNAL");
  await expect(await page.locator(".journal-pill")).toHaveCount(1);

  await changeTab(page, "SETTINGS");
  await page.locator("#remove-all-settings").click();

  await changeTab(page, "JOURNAL");
  await expect(await page.locator(".journal-pill")).toHaveCount(0);
});

test("the user removes app state (including journals)", async ({
  context,
  page,
}) => {
  await changeTab(page, "SETTINGS");

  await page.locator("#remove-app-state").click();

  await expectActiveTab(page, "JOURNAL");
  await changeTab(page, "GRAPH");

  // there should only be one day's worth of bars (today's)
  await expect(await page.locator(".daily-bar")).toHaveCount(5);

  // ...and all the bars should be at the default value (1)
  await expect(await page.locator(".daily-bar-1")).toHaveCount(5);
});

test("the debug log contains events triggered", async ({ context, page }) => {
  await changeTab(page, "SETTINGS");

  await expect(await page.locator(".event-log").innerText()).toEqual(
    "UpdateCurrentTab"
  );

  await changeTab(page, "JOURNAL");

  {
    // Go back one day
    await page.locator("#previous-day").click();

    await expect(await page.locator(".current-day")).toHaveText(/1 day ago/);
  }

  const promptGroups = await page.locator(".prompt-group").all();

  for (const group of promptGroups) {
    const responseButton = await group.locator(".prompt-answer").nth(2);
    responseButton.click();
    await expect(responseButton).toHaveClass(/active/);
  }

  await changeTab(page, "SETTINGS");

  await expect(await page.locator(".event-log").innerText()).toEqual(
    `
UpdateCurrentTab
UpdateCurrentTab
UpdateCurrentDay
UpdatePromptValue
UpdatePromptValue
UpdatePromptValue
UpdatePromptValue
UpdatePromptValue
UpdatePromptValue
UpdateCurrentTab
  `.trim()
  );
});
