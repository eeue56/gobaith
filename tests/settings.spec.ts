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

test("the debug log contains events triggered", async ({ context, page }) => {
  await page.locator('.tab:text("Settings")').click();

  await expect(await page.locator(".event-log").innerText()).toEqual(
    "ReadyToRender\nUpdateCurrentTab"
  );

  await page.locator('.tab:text("Journal")').click();

  {
    // Go back one day
    await page.locator("#previous-day").click();

    await expect(
      await page.locator(".current-day").first().innerHTML()
    ).toContain("1 day ago");
  }

  const promptGroups = await page.locator(".prompt-group").all();

  for (const group of promptGroups) {
    const responseButton = await group.locator(".prompt-answer").nth(2);
    responseButton.click();
    await expect(responseButton).toHaveClass(/pure-button-active/);
  }

  await page.locator('.tab:text("Settings")').click();

  await expect(await page.locator(".event-log").innerText()).toEqual(
    `
ReadyToRender
UpdateCurrentTab
UpdateCurrentTab
UpdateCurrentDay
UpdatePromptValue
UpdatePromptValue
UpdatePromptValue
UpdatePromptValue
UpdatePromptValue
UpdateCurrentTab
  `.trim()
  );
});
