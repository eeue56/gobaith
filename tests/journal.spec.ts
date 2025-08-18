import { expect } from "@playwright/test";
import { PROMPTS } from "../src/types";
import { test } from "./fixtures";
import { expectActiveTab } from "./helpers";

test("renders", async ({ context, page }) => {
  await expect(page).toHaveTitle("Mood tracker");
});

test("it starts on daily page", async ({ context, page }) => {
  await expect(
    await page.locator(".current-day").first().innerHTML()
  ).toContain("Today");

  await expectActiveTab(page, "Journal");
});

test("the user can choose answers to prompts", async ({
  context,
  page,
  baseURL,
}) => {
  const numberOfPrompts = Object.keys(PROMPTS).length;
  await expect(await page.locator(".prompt-group")).toHaveCount(
    numberOfPrompts
  );

  const promptGroups = await page.locator(".prompt-group").all();
  {
    // prompts should start at "None"
    const promptAnswers = await page
      .locator(".prompt-button-container.active")
      .all();
    await expect(promptAnswers).toHaveLength(numberOfPrompts);

    for (const promptAnswer of promptAnswers) {
      await expect(await promptAnswer.innerHTML()).toContain("None");
    }
  }

  for (const group of promptGroups) {
    for (const responseButton of await group
      .locator(".circle-container")
      .all()) {
      responseButton.click();
      await expect(responseButton).toHaveClass(/active/);
    }
  }

  await expect(await page.locator(".prompt-answer.active")).toHaveCount(
    numberOfPrompts
  );

  if (!process.env.IS_ELECTRON && !process.env.IS_ANDROID) {
    await page.goto(baseURL || "");
  } else {
    await page.locator('.tab:text("Graphs")').click();
    await expectActiveTab(page, "Graphs");

    await page.locator('.tab:text("Journal")').click();
    await expectActiveTab(page, "Journal");
  }

  await expect(page).toHaveTitle("Mood tracker");

  {
    // Prompts should keep state after refreshing
    const promptAnswers = await page
      .locator(".prompt-button-container.active")
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

    await expect(await page.locator(".current-day")).toHaveText(/1 day ago/);
  }

  {
    // Go to today
    await page.locator("#reset-day").click();

    await expect(await page.locator(".current-day")).toHaveText(/Today/);
  }

  {
    // Go forward one day
    await page.locator("#next-day").click();

    await expect(await page.locator(".current-day")).toHaveText(/1 day ahead/);

    await page.locator("#reset-day").click();
  }
});

test("the user can enter log entries", async ({ context, page }) => {
  await expect(
    await page.locator(".current-day").first().innerHTML()
  ).toContain("Today");

  await expect(await page.locator(".journal-entry")).toHaveCount(0);

  const logEntryToFill = "Today was a good day";
  await page.locator("#new-journal-entry").fill(logEntryToFill);
  await page.locator(".save-log-entry-button").first().click();

  await expect(await page.locator("#new-journal-entry").innerText()).toEqual(
    ""
  );
  await expect(
    await page
      .locator(".journal-entries")
      .evaluate((div) => div.children.length)
  ).toEqual(1);
});
