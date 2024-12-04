import { expect, test } from "@playwright/test";
import { PROMPTS } from "../src/types";
import { awaitForServiceWorker } from "./helpers";

test("renders", async ({ context, page }) => {
  const url = "http://localhost:3003";
  await page.goto(url.toString());
  await awaitForServiceWorker(context);

  await expect(page).toHaveTitle("Mood tracker");
});

test("it starts on daily page", async ({ context, page }) => {
  const url = "http://localhost:3003";
  await page.goto(url.toString());
  await awaitForServiceWorker(context);

  await expect(
    await page.locator(".current-day").first().innerHTML()
  ).toContain("Today");
});

test("the user can choose answers to prompts", async ({ context, page }) => {
  const url = "http://localhost:3003";
  await page.goto(url.toString());
  await awaitForServiceWorker(context);

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

  await page.goto(url.toString());

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
  const url = "http://localhost:3003";
  await page.goto(url.toString());
  await awaitForServiceWorker(context);

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
