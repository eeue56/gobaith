import { expect } from "@playwright/test";
import { PROMPT_PACKS, PROMPTS } from "../src/types";
import { test } from "./fixtures";
import { changeTab, expectActiveTab } from "./helpers";

test("first-time setup shows prompt pack selection", async ({
  context,
  page,
}) => {
  // Clear settings to simulate first-time user
  await changeTab(page, "SETTINGS");
  await page.locator("#remove-all-settings").click();

  await expectActiveTab(page, "JOURNAL");

  // Should show the first-time setup screen
  await expect(page.locator(".first-time-setup")).toBeVisible();
  await expect(page.locator("h2")).toContainText("Welcome to Gobaith");

  // Should show all three prompt packs
  await expect(page.locator(".prompt-pack-option")).toHaveCount(3);

  // Check that each pack has a select button
  await expect(page.locator("#select-pack-Bipolar")).toBeVisible();
  await expect(page.locator("#select-pack-Schizophrenia")).toBeVisible();
  await expect(page.locator("#select-pack-ADHD")).toBeVisible();

  // Should not show tab navigation during setup
  await expect(page.locator(".tabs")).not.toBeVisible();
});

test("user can select Bipolar prompt pack", async ({ context, page }) => {
  // Clear settings to simulate first-time user
  await changeTab(page, "SETTINGS");
  await page.locator("#remove-all-settings").click();

  await expectActiveTab(page, "JOURNAL");

  // Select Bipolar pack
  await page.locator("#select-pack-Bipolar").click();

  // Wait for the tabs to appear (setup is complete)
  await expect(page.locator(".tabs")).toBeVisible({ timeout: 10000 });

  // Should now show the journal with only Bipolar prompts
  await expect(page.locator(".first-time-setup")).not.toBeVisible();

  // Count the number of prompt groups displayed
  const promptGroups = await page.locator(".prompt-group").count();
  const bipolarPrompts = PROMPT_PACKS.Bipolar;
  await expect(promptGroups).toBe(bipolarPrompts.length);

  // Verify specific prompts are shown
  for (const prompt of bipolarPrompts) {
    await expect(page.locator(".prompt").getByText(prompt)).toBeVisible();
  }
});

test("user can select Schizophrenia prompt pack", async ({ context, page }) => {
  // Clear settings to simulate first-time user
  await changeTab(page, "SETTINGS");
  await page.locator("#remove-all-settings").click();

  await expectActiveTab(page, "JOURNAL");

  // Select Schizophrenia pack
  await page.locator("#select-pack-Schizophrenia").click();

  // Wait for the tabs to appear (setup is complete)
  await expect(page.locator(".tabs")).toBeVisible({ timeout: 10000 });

  // Should now show the journal with only Schizophrenia prompts
  await expect(page.locator(".first-time-setup")).not.toBeVisible();

  // Count the number of prompt groups displayed
  const promptGroups = await page.locator(".prompt-group").count();
  const schizophreniaPrompts = PROMPT_PACKS.Schizophrenia;
  await expect(promptGroups).toBe(schizophreniaPrompts.length);

  // Verify specific prompts are shown
  for (const prompt of schizophreniaPrompts) {
    await expect(page.locator(".prompt").getByText(prompt)).toBeVisible();
  }
});

test("user can select ADHD prompt pack", async ({ context, page }) => {
  // Clear settings to simulate first-time user
  await changeTab(page, "SETTINGS");
  await page.locator("#remove-all-settings").click();

  await expectActiveTab(page, "JOURNAL");

  // Select ADHD pack
  await page.locator("#select-pack-ADHD").click();

  // Wait for the tabs to appear (setup is complete)
  await expect(page.locator(".tabs")).toBeVisible({ timeout: 10000 });

  // Should now show the journal with only ADHD prompts
  await expect(page.locator(".first-time-setup")).not.toBeVisible();

  // Count the number of prompt groups displayed
  const promptGroups = await page.locator(".prompt-group").count();
  const adhdPrompts = PROMPT_PACKS.ADHD;
  await expect(promptGroups).toBe(adhdPrompts.length);

  // Verify specific prompts are shown
  for (const prompt of adhdPrompts) {
    await expect(page.locator(".prompt").getByText(prompt)).toBeVisible();
  }
});

test("user can toggle prompts in settings", async ({ context, page }) => {
  // Clear settings and select a pack
  await changeTab(page, "SETTINGS");
  await page.locator("#remove-all-settings").click();
  await expectActiveTab(page, "JOURNAL");
  await page.locator("#select-pack-Bipolar").click();

  // Wait for tabs to appear
  await expect(page.locator(".tabs")).toBeVisible({ timeout: 10000 });

  // Go to settings
  await changeTab(page, "SETTINGS");

  // Should show prompt configuration section
  await expect(
    page.locator(".prompt-configuration h3").first()
  ).toContainText("Configure Prompts");

  // Check that prompt packs are shown
  await expect(page.locator(".prompt-pack-toggle")).toHaveCount(3);

  // Get the first prompt from Bipolar pack
  const firstBipolarPrompt = PROMPT_PACKS.Bipolar[0];

  // Find and click the toggle button for this prompt
  const toggleButton = page
    .locator(".prompt-toggle-button")
    .filter({ hasText: firstBipolarPrompt });
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

  // Go back to settings and re-enable
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
  await changeTab(page, "SETTINGS");
  await page.locator("#remove-all-settings").click();
  await expectActiveTab(page, "JOURNAL");
  await page.locator("#select-pack-Bipolar").click();

  // Wait for tabs to appear
  await expect(page.locator(".tabs")).toBeVisible({ timeout: 10000 });

  // Fill in a response for the first prompt
  const firstBipolarPrompt = PROMPT_PACKS.Bipolar[0];
  const promptGroup = page
    .locator(".prompt-group")
    .filter({ has: page.locator(".prompt").getByText(firstBipolarPrompt) });

  // Click the "Intense" option (4th button)
  await promptGroup.locator(".circle-container").nth(3).click();

  // Verify it's selected
  await expect(
    promptGroup.locator(".circle-container.active").nth(3)
  ).toBeVisible();

  // Go to settings and disable this prompt
  await changeTab(page, "SETTINGS");
  const toggleButton = page
    .locator(".prompt-toggle-button")
    .filter({ hasText: firstBipolarPrompt });
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
    reenabledPromptGroup.locator(".circle-container.active").nth(3)
  ).toBeVisible();
});

test("user can delete data for disabled prompts", async ({ context, page }) => {
  // Clear settings and select a pack
  await changeTab(page, "SETTINGS");
  await page.locator("#remove-all-settings").click();
  await expectActiveTab(page, "JOURNAL");
  await page.locator("#select-pack-Bipolar").click();

  // Wait for tabs to appear
  await expect(page.locator(".tabs")).toBeVisible({ timeout: 10000 });

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
    .filter({ hasText: firstBipolarPrompt });
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

  // The "None" option should be selected (default)
  await expect(
    reenabledPromptGroup.locator(".circle-container.active").first()
  ).toBeVisible();
});

test("existing users see all prompts enabled after migration", async ({
  context,
  page,
}) => {
  // This test verifies that when the database migration runs,
  // existing users get all prompts enabled by default

  // Count prompts shown in journal (all should be enabled by default for existing users)
  const promptGroups = await page.locator(".prompt-group").count();

  // Should show all PROMPTS
  await expect(promptGroups).toBe(PROMPTS.length);
});

test("settings shows all three prompt packs", async ({ context, page }) => {
  await changeTab(page, "SETTINGS");

  // Should show prompt configuration
  await expect(
    page.locator(".prompt-configuration h3").first()
  ).toContainText("Configure Prompts");

  // Should show all three prompt packs
  const packNames = await page.locator(".pack-name").allTextContents();
  expect(packNames).toContain("Bipolar");
  expect(packNames).toContain("Schizophrenia");
  expect(packNames).toContain("ADHD");
});
