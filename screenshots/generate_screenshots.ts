import {
  _electron as electron,
  ElectronApplication,
  Page,
} from "@playwright/test";
import { mkdtemp } from "fs/promises";
import { generateRandomMoodValue, isPrompt, Prompt } from "../src/types";
import { generateData } from "../src/utils/data";
import { dateToDay } from "../src/utils/dates";

async function launchElectron(): Promise<{
  electronApp: ElectronApplication;
  page: Page;
}> {
  const tempUserDir = await mkdtemp("/tmp/gobaith-electron");
  const electronApp = await electron.launch({
    args: ["./electron/main.js", `--user-data-dir=${tempUserDir}`],
  });

  const page = await electronApp.firstWindow();

  await page.locator(".current-day").first().innerHTML();

  await page.locator('button:text("Importer")').click();
  await page
    .locator("#import-text")
    .fill(JSON.stringify(generateData(dateToDay(new Date()))));

  await page.locator("#update-import-from-text").click();

  return { page: page, electronApp };
}

async function closeElectron(electronApp: ElectronApplication) {
  await electronApp.close();
}

const logEntries: Record<Prompt, string> = {
  "Today's feelings of anxiety":
    "I felt a bit anxious when getting on a crowded train",
  "Today's feelings of elevation": "I could do anything right now",
  "Today's feelings of depression": "I don't have anyone to talk to",
  "Today's feelings of irritableness": "I argued with my friend",
  "Today's psychotic symptoms": "I saw some unusual things",
};

async function screenshotDailyTracker(page: Page) {
  await page.locator('.tab:text("Journal")').click();

  const promptGroups = await page.locator(".prompt-group").all();

  for (const group of promptGroups) {
    const prompName = await group.locator(".prompt").innerText();
    const answersInGroup = await group.locator(".prompt-answer").all();

    const moodValue = generateRandomMoodValue();

    if (isPrompt(prompName)) {
      if (moodValue > 2) {
        const logEntryToFill = logEntries[prompName];
        //await page.locator("#new-journal-entry").fill(logEntryToFill);
        //await page.locator(".save-log-entry-button").first().click();
      }
    } else {
      console.error(`Expected a prompt, but got "${prompName}"`);
    }
    const responseButton = answersInGroup[moodValue - 1];
    await responseButton.click();
  }

  await page.screenshot({
    path: "./screenshots/images/daily_tracker.png",
  });
}

async function screenshotImporter(page: Page) {
  await page.locator('.tab:text("Importer")').click();

  await page.screenshot({
    path: "./screenshots/images/importer.png",
  });
}

async function screenshotGraphDailyBar(page: Page) {
  await page.locator('.tab:text("Graphs")').click();

  await page.screenshot({
    path: "./screenshots/images/graph_daily_bar.png",
  });
}

async function screenshotGraphSpiderweb(page: Page) {
  await page.locator('.tab:text("Graphs")').click();
  await page.locator("#graph-selection").selectOption("SPIDERWEB");

  // pause so that the animation can finish
  await page.waitForTimeout(500);

  await page.screenshot({
    path: "./screenshots/images/graph_spiderweb.png",
  });
}

async function screenshotGraphLineOverview(page: Page) {
  await page.locator('.tab:text("Graphs")').click();
  await page.locator("#graph-selection").selectOption("LINE_OVERVIEW");

  // pause so that the animation can finish
  await page.waitForTimeout(500);

  await page.screenshot({
    path: "./screenshots/images/graph_line_overview.png",
  });
}

async function screenshotGraphBipolarPeriods(page: Page) {
  await page.locator('.tab:text("Graphs")').click();
  await page.locator("#graph-selection").selectOption("BIPOLAR_PERIODS");

  await page.screenshot({
    path: "./screenshots/images/graph_bipolar_periods.png",
  });
}

async function screenshotGraphTotaledBar(page: Page) {
  await page.locator('.tab:text("Graphs")').click();
  await page.locator("#graph-selection").selectOption("TOTALED_DAILY_BAR");

  await page.screenshot({
    path: "./screenshots/images/graph_totaled_bar.png",
  });
}

async function screenshotSettings(page: Page) {
  await page.locator('.tab:text("Settings")').click();

  await page.screenshot({
    path: "./screenshots/images/settings.png",
  });
}

async function main() {
  const { electronApp, page } = await launchElectron();
  await screenshotDailyTracker(page);
  await screenshotSettings(page);
  await screenshotGraphDailyBar(page);
  await screenshotImporter(page);
  await screenshotGraphSpiderweb(page);
  await screenshotGraphLineOverview(page);
  await screenshotGraphBipolarPeriods(page);
  await screenshotGraphTotaledBar(page);
  await closeElectron(electronApp);
}

main();
