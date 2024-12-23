import { expect } from "@playwright/test";
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

test("the importer can import state", async ({ context, page }) => {
  await page.locator('.tab:text("Importer")').click();

  const responses = PromptResponses(1, 2, 3, 4, 1);
  const logEntry: LogEntry = { time: new Date(), text: "Imported stuff" };
  const journalEntry = JournalEntry(
    dateToDay(new Date()),
    {},
    responses,
    13.5,
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

  expect(await page.locator("#textarea-export-state").inputValue()).toContain(
    logEntry.text
  );

  await page.locator('.tab:text("Journal")').click();

  await expect(await page.locator("#hours-slept").innerText()).toContain(
    `${journalEntry.hoursSlept}`
  );

  const promptGroups = await page.locator(".prompt-group").all();

  for (const promptGroup of promptGroups) {
    const prompt = await promptGroup.locator(".prompt");
    const promptTitle = await prompt.innerText();

    if (!isPrompt(promptTitle)) {
      console.error("Expected prompt, got", promptTitle);
      await expect(promptTitle).toEqual("Invalid prompt!");
      break;
    }

    const promptValue = responses[promptTitle];
    const moodValue = await promptGroup
      .locator(".pure-button-active")
      .getAttribute("data-mood-value");

    await expect(moodValue).toEqual(`${promptValue}`);
  }
});

test("the importer can import settings", async ({ context, page }) => {
  await page.locator('.tab:text("Importer")').click();

  const settings: Settings = {
    kind: "Settings",
    currentPills: ["Ibux 200mg"],
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

  await page.waitForTimeout(500);

  expect(
    await page.locator("#textarea-export-settings").inputValue()
  ).toContain("Ibux 200mg");
});
