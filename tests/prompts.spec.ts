import { expect } from "@playwright/test";
import { PROMPT_PACKS } from "../src/types";
import { test } from "./fixtures";
import { changeTab, chooseBipolarPack, expectActiveTab } from "./helpers";

test("user can toggle prompts in settings", async ({ context, page }) => {
  if ((await page.locator(".active-tab").all()).length === 0) {
  } else {
    await changeTab(page, "SETTINGS");
    await page.locator("#remove-all-settings").click();
  }

  await page.locator("#select-pack-Bipolar").click();

  await expect(page.locator(".tabs")).toBeVisible({ timeout: 10000 });

  await changeTab(page, "SETTINGS");
  await expect(page.locator(".prompt-configuration h3").first()).toContainText(
    "Configure Prompts"
  );

  await expect(page.locator(".prompt-pack-toggle")).toHaveCount(3);

  const firstBipolarPrompt = PROMPT_PACKS.Bipolar[0];

  // Find and click the toggle button for this prompt
  const toggleButton = page
    .locator(".prompt-toggle-button")
    .filter({ hasText: firstBipolarPrompt })
    .first();
  await expect(toggleButton).toHaveClass(/enabled/);

  // Click to disable
  await toggleButton.click();

  // Button should now be disabled
  await expect(toggleButton).toHaveClass(/disabled/);

  // Go back to journal and verify the prompt is not shown
  await changeTab(page, "JOURNAL");
  await expect(
    page.locator(".prompt").getByText(firstBipolarPrompt)
  ).not.toBeVisible();

  await changeTab(page, "SETTINGS");
  await toggleButton.click();
  await expect(toggleButton).toHaveClass(/enabled/);

  // Verify it's shown again in journal
  await changeTab(page, "JOURNAL");
  await expect(
    page.locator(".prompt").getByText(firstBipolarPrompt)
  ).toBeVisible();
});

test("disabled prompt data is retained", async ({ context, page }) => {
  // Clear settings and select a pack
  if ((await page.locator(".active-tab").all()).length === 0) {
    await chooseBipolarPack(page);
  } else {
    await changeTab(page, "SETTINGS");
    await page.locator("#remove-all-settings").click();
    await chooseBipolarPack(page);
  }

  await changeTab(page, "SETTINGS");
  await page.locator("#remove-all-settings").click();
  await chooseBipolarPack(page);

  // Wait for tabs to appear
  await expect(page.locator(".tabs")).toBeVisible({ timeout: 10000 });

  await changeTab(page, "JOURNAL");

  // Fill in a response for the first prompt
  const firstBipolarPrompt = PROMPT_PACKS.Bipolar[0];
  const promptGroup = page
    .locator(".prompt-group")
    .filter({ has: page.locator(".prompt").getByText(firstBipolarPrompt) });

  // Click the "Intense" option (4th button)
  await promptGroup.locator(".circle-container").nth(3).click();

  // Verify it's selected
  await expect(promptGroup.locator(".circle-container.active")).toBeVisible();

  // Go to settings and disable this prompt
  await changeTab(page, "SETTINGS");
  const toggleButton = page
    .locator(".prompt-toggle-button")
    .filter({ hasText: firstBipolarPrompt })
    .first();
  await toggleButton.click();

  // Go back to journal - prompt should not be visible
  await changeTab(page, "JOURNAL");
  await expect(
    page.locator(".prompt").getByText(firstBipolarPrompt)
  ).not.toBeVisible();

  // Re-enable the prompt
  await changeTab(page, "SETTINGS");
  await toggleButton.click();

  // Go back to journal - data should still be there
  await changeTab(page, "JOURNAL");
  const reenabledPromptGroup = page
    .locator(".prompt-group")
    .filter({ has: page.locator(".prompt").getByText(firstBipolarPrompt) });

  // The "Intense" option should still be selected
  await expect(
    reenabledPromptGroup.locator(".circle-container.active")
  ).toBeVisible();
});

test("user can delete data for disabled prompts", async ({ context, page }) => {
  if ((await page.locator(".active-tab").all()).length === 0) {
  } else {
    await changeTab(page, "SETTINGS");
    await page.locator("#remove-all-settings").click();
  }
  await chooseBipolarPack(page);

  await expectActiveTab(page, "JOURNAL");

  // Fill in a response for the first prompt
  const firstBipolarPrompt = PROMPT_PACKS.Bipolar[0];
  const promptGroup = page
    .locator(".prompt-group")
    .filter({ has: page.locator(".prompt").getByText(firstBipolarPrompt) });

  // Click the "Intense" option (4th button)
  await promptGroup.locator(".circle-container").nth(3).click();

  // Disable this prompt
  await changeTab(page, "SETTINGS");
  const toggleButton = page
    .locator(".prompt-toggle-button")
    .filter({ hasText: firstBipolarPrompt })
    .first();
  await toggleButton.click();

  // Should show the delete data section
  await expect(page.locator(".delete-prompt-data h3")).toContainText(
    "Delete Old Prompt Data"
  );

  // Find the delete button for this prompt
  const deleteButton = page
    .locator(".delete-prompt-item")
    .filter({ hasText: firstBipolarPrompt })
    .locator(".delete-prompt-button");

  await deleteButton.click();

  // Re-enable the prompt
  await toggleButton.click();

  // Go back to journal - data should be gone (default value)
  await changeTab(page, "JOURNAL");
  const reenabledPromptGroup = page
    .locator(".prompt-group")
    .filter({ has: page.locator(".prompt").getByText(firstBipolarPrompt) });

  await expect(
    reenabledPromptGroup.locator(".circle-container.active")
  ).toBeVisible();
});

test("settings shows all three prompt packs", async ({ context, page }) => {
  await chooseBipolarPack(page);
  await changeTab(page, "SETTINGS");

  // Should show prompt configuration
  await expect(page.locator(".prompt-configuration h3").first()).toContainText(
    "Configure Prompts"
  );

  // Should show all three prompt packs
  const packNames = await page.locator(".pack-name").allTextContents();
  expect(packNames).toContain("Bipolar");
  expect(packNames).toContain("Schizophrenia");
  expect(packNames).toContain("ADHD");
});
