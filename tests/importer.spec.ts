import { expect } from "@playwright/test";
import { BUILT_IN_QUERIES } from "../src/logic/query";
import {
  AppState,
  isPrompt,
  JournalEntry,
  LATEST_DATABASE_VERSION,
  LogEntry,
  PromptResponses,
  Settings,
} from "../src/types";
import { dateToDay } from "../src/utils/dates";
import { test } from "./fixtures";
import { awaitForTitleToChange, changeTab, expectActiveTab } from "./helpers";

test("the importer can import state", async ({ context, page }) => {
  await changeTab(page, "IMPORT");

  const responses = PromptResponses(1, 2, 3, 4, 1);
  const logEntry: LogEntry = { time: new Date(), text: "Imported stuff" };
  const journalEntry = JournalEntry(
    dateToDay(new Date()),
    {},
    responses,
    3,
    [logEntry]
  );

  const state: AppState = {
    kind: "AppState",
    day: dateToDay(new Date()),
    currentTab: "IMPORT",
    currentGraph: "DAILY_BAR",
    journalEntries: [journalEntry],
    databaseVersion: LATEST_DATABASE_VERSION,
  };

  const stringState = JSON.stringify(state);
  await page.locator("#import-text").fill(stringState);
  await expect(
    (
      await page.locator("#import-text").inputValue()
    ).length
  ).toEqual(stringState.length);

  await page.locator("#update-import-from-text").dispatchEvent("click");

  await expect(await page.locator("#textarea-download-state")).toHaveValue(
    new RegExp(logEntry.text)
  );

  await changeTab(page, "JOURNAL");

  // Find the sleep quality prompt group specifically
  const sleepPromptGroup = page.locator(".prompt-group").filter({
    has: page.locator('.prompt h4:text("Sleep quality")')
  });
  
  // Verify the sleep quality prompt exists
  await expect(sleepPromptGroup).toHaveCount(1);
  
  // Check the active mood value for sleep quality
  const sleepMoodValue = await sleepPromptGroup
    .locator(".prompt-answer.active")
    .getAttribute("data-mood-value");
  expect(sleepMoodValue).toEqual(`${journalEntry.sleepQuality}`);

  const promptGroups = await page.locator(".prompt-group").all();

  for (const promptGroup of promptGroups) {
    const prompt = await promptGroup.locator(".prompt h4");
    const promptTitle = await prompt.innerText();

    if (!isPrompt(promptTitle) && promptTitle !== "Sleep quality") {
      console.error("Expected prompt, got", promptTitle);
      await expect(promptTitle).toEqual("Invalid prompt!");
      break;
    }

    if (isPrompt(promptTitle)) {
      const promptValue = responses[promptTitle];
      const moodValue = await promptGroup
        .locator(".prompt-answer.active")
        .getAttribute("data-mood-value");

      await expect(moodValue).toEqual(`${promptValue}`);
    }
  }
});

test("the importer can import settings", async ({ context, page }) => {
  await changeTab(page, "IMPORT");

  const settings: Settings = {
    kind: "Settings",
    currentPills: ["Ibux 200mg"],
    queries: [...BUILT_IN_QUERIES],
    databaseVersion: LATEST_DATABASE_VERSION,
  };

  const stringSettings = JSON.stringify(settings);
  await page.locator("#import-text").fill(stringSettings);
  await expect(
    (
      await page.locator("#import-text").inputValue()
    ).length
  ).toEqual(stringSettings.length);

  await page.locator("#update-import-from-text").dispatchEvent("click");

  await expect(await page.locator("#textarea-download-settings")).toHaveValue(
    /Ibux 200mg/
  );

  await page.reload();

  await awaitForTitleToChange(page);

  await expectActiveTab(page, "IMPORT");

  await expect(await page.locator("#textarea-download-settings")).toHaveValue(
    /Ibux 200mg/
  );
});
