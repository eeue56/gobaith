import { expect } from "@playwright/test";
import { PROMPT_PACKS } from "../src/types";
import { testOnboarding } from "./fixtures";
import { chooseBipolarPack, expectActiveTab } from "./helpers";

testOnboarding(
  "the user gets redirected to the JOURNAL tab after chosing a pack",
  async ({ context, page }) => {
    await chooseBipolarPack(page);
    await expectActiveTab(page, "JOURNAL");
  }
);

testOnboarding(
  "first-time setup shows prompt pack selection",
  async ({ context, page }) => {
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
  }
);

testOnboarding(
  "user can select Bipolar prompt pack",
  async ({ context, page }) => {
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
  }
);

testOnboarding(
  "user can select Schizophrenia prompt pack",
  async ({ context, page }) => {
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
  }
);

testOnboarding(
  "user can select ADHD prompt pack",
  async ({ context, page }) => {
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
  }
);
