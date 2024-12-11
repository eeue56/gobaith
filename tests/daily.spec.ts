import { expect } from "@playwright/test";
import { PROMPTS } from "../src/types";
import { test } from "./fixtures";
import { getActiveTab } from "./helpers";

const url = "http://localhost:3003";

test("renders", async ({ context, page }) => {
  await expect(page).toHaveTitle("Mood tracker");
});

test("it starts on daily page", async ({ context, page }) => {
  await expect(
    await page.locator(".current-day").first().innerHTML()
  ).toContain("Today");

  await expect(await getActiveTab(page)).toBe("Journal");
});

test("the user can choose answers to prompts", async ({ context, page }) => {
  await expect(page).toHaveTitle("Mood tracker");
  const promptGroups = await page.locator(".prompt-group").all();

  const numberOfPrompts = Object.keys(PROMPTS).length;
  expect(promptGroups).toHaveLength(numberOfPrompts);

  {
    // prompts should start at "None"
    const promptAnswers = await page
      .locator(".pure-button-active.prompt-answer")
      .all();
    await expect(promptAnswers).toHaveLength(numberOfPrompts);

    for (const promptAnswer of promptAnswers) {
      expect(await promptAnswer.innerHTML()).toContain("None");
    }
  }

  for (const group of promptGroups) {
    for (const responseButton of await group.locator(".prompt-answer").all()) {
      responseButton.click();
      await expect(responseButton).toHaveClass(/pure-button-active/);
    }
  }

  await expect(
    await page.locator(".pure-button-active.prompt-answer").all()
  ).toHaveLength(numberOfPrompts);

  if (!process.env.IS_ELECTRON) {
    await page.goto(url.toString());
  }

  await expect(page).toHaveTitle("Mood tracker");

  {
    // Prompts should keep state after refreshing
    const promptAnswers = await page
      .locator(".pure-button-active.prompt-answer")
      .all();
    await expect(promptAnswers).toHaveLength(numberOfPrompts);

    for (const promptAnswer of promptAnswers) {
      expect(await promptAnswer.innerHTML()).toContain("Intense");
    }
  }
});

test("the user can move between dates", async ({ context, page }) => {
  await expect(
    await page.locator(".current-day").first().innerHTML()
  ).toContain("Today");

  {
    // Go back one day
    await page.locator("#previous-day").click();

    await expect(
      await page.locator(".current-day").first().innerHTML()
    ).toContain("1 day ago");
  }

  {
    // Go to today
    await page.locator("#reset-day").click();

    await expect(
      await page.locator(".current-day").first().innerHTML()
    ).toContain("Today");
  }

  {
    // Go forward one day
    await page.locator("#next-day").click();

    await expect(
      await page.locator(".current-day").first().innerHTML()
    ).toContain("1 day ahead");
  }
});
