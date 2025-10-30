import {
  _android as android,
  AndroidDevice,
  Browser,
  chromium,
  _electron as electron,
  ElectronApplication,
  expect,
  Page,
} from "@playwright/test";
import { mkdtemp } from "fs/promises";
import { generateRandomMoodValue, isPrompt, Prompt } from "../src/types";
import { generateData } from "../src/utils/data";
import { dateToDay } from "../src/utils/dates";
import { awaitForTitleToChange, changeTab } from "../tests/helpers";

type PageRunner =
  | { kind: "Electron"; electronApp: ElectronApplication }
  | { kind: "Android"; device: AndroidDevice }
  | { kind: "Chromium"; browser: Browser };

async function closeElectron(electronApp: ElectronApplication): Promise<void> {
  await electronApp.close();
}

const logEntries: Record<Prompt, string> = {
  "Sleep quality": "I had a good night's sleep",
  "Today's feelings of anxiety":
    "I felt a bit anxious when getting on a crowded train",
  "Today's feelings of elevation": "I could do anything right now",
  "Today's feelings of depression": "I don't have anyone to talk to",
  "Today's feelings of irritableness": "I argued with my friend",
  "Today's psychotic symptoms": "I saw some unusual things",
  "Today's focus and concentration": "I had trouble focusing on tasks",
  "Today's hyperactivity or impulsivity": "I felt restless and impulsive",
};

export async function addLogEntryForScreenshot(
  prompName: Prompt,
  page: Page
): Promise<void> {
  const logEntryToFill = logEntries[prompName];
  await page.locator("#new-journal-entry").fill(logEntryToFill);
  await page.locator(".save-log-entry-button").first().click();
}

async function screenshotDailyTracker(page: Page, basePath: string) {
  await changeTab(page, "JOURNAL");

  const promptGroups = await page.locator(".prompt-group").all();

  for (const group of promptGroups) {
    const prompName = await group.locator(".prompt").innerText();
    const answersInGroup = await group.locator(".prompt-answer").all();

    const moodValue = generateRandomMoodValue();

    if (isPrompt(prompName)) {
      if (moodValue > 2) {
        // this will add log entries for screenshot purposes,
        // but ignore it for now
        // await addLogEntryForScreenshot(prompName, page);
      }
    } else {
      console.error(`Expected a prompt, but got "${prompName}"`);
    }
    const responseButton = answersInGroup[moodValue - 1];
    await responseButton.click();
  }

  await page.screenshot({
    path: `${basePath}/daily_tracker.png`,
  });
}

async function screenshotImporter(page: Page, basePath: string) {
  await changeTab(page, "IMPORT");

  await page.screenshot({
    path: `${basePath}/importer.png`,
  });
}

async function screenshotGraphDailyBar(page: Page, basePath: string) {
  await changeTab(page, "GRAPH");

  await page.screenshot({
    path: `${basePath}/graph_daily_bar.png`,
  });
}

async function screenshotGraphSpiderweb(page: Page, basePath: string) {
  await changeTab(page, "GRAPH");
  await page.locator("#graph-selection").selectOption("SPIDERWEB");

  await page.screenshot({
    path: `${basePath}/graph_spiderweb.png`,
  });
}

async function screenshotGraphLineOverview(page: Page, basePath: string) {
  await changeTab(page, "GRAPH");
  await page.locator("#graph-selection").selectOption("LINE_OVERVIEW");

  // only show one field
  for (let i = 0; i < 5; i++) {
    await page.locator(".legend-color-icon").nth(i).click();
  }
  await page.locator(".legend-color-icon").nth(2).click();

  await page.screenshot({
    path: `${basePath}/graph_line_overview.png`,
    scale: "device",
  });
}

async function screenshotGraphBipolarPeriods(page: Page, basePath: string) {
  await changeTab(page, "GRAPH");
  await page.locator("#graph-selection").selectOption("BIPOLAR_PERIODS");

  await page.screenshot({
    path: `${basePath}/graph_bipolar_periods.png`,
  });
}

async function screenshotGraphTotaledBar(page: Page, basePath: string) {
  await changeTab(page, "GRAPH");
  await page.locator("#graph-selection").selectOption("TOTALED_DAILY_BAR");

  await page.screenshot({
    path: `${basePath}/graph_totaled_bar.png`,
  });
}

async function screenshotGraphInteractiveQueries(page: Page, basePath: string) {
  await changeTab(page, "GRAPH");
  await page.locator("#graph-selection").selectOption("Interactive queries");

  await expect(page.locator("#add-filter-query")).toBeVisible();
  // pause so that the animation can finish
  await page.waitForTimeout(500);

  await page.screenshot({
    path: `${basePath}/graph_interactive_queries.png`,
  });
}

async function screenshotSettings(page: Page, basePath: string) {
  await changeTab(page, "SETTINGS");

  await page.screenshot({
    path: `${basePath}/settings.png`,
    scale: "device",
  });
}

async function setupPage(page: Page): Promise<void> {
  await page.locator(".current-day").first().innerHTML();

  await page.locator('button:text("Importer")').click();
  await page
    .locator("#import-text")
    .fill(JSON.stringify(generateData(dateToDay(new Date()))));

  await page.locator("#update-import-from-text").click();
}

function getBasePath(runner: PageRunner): string {
  switch (runner.kind) {
    case "Chromium":
    case "Electron": {
      return "./screenshots/images/";
    }
    case "Android": {
      return "./screenshots/android_images/";
    }
  }
}

async function makePage(): Promise<{ page: Page; runner: PageRunner }> {
  if (process.env.IS_ANDROID) {
    const devices = await android.devices();

    const [device] = devices;
    await device.installApk(
      "/home/noah/dev/mental-health-tracker/android/app/build/outputs/apk/debug/app-debug.apk"
    );
    console.log("clearing...");
    await device.shell("pm clear com.gobaith.eeue56");
    await device.shell("am start com.gobaith.eeue56/.MainActivity");

    const webview = await device.webView({
      pkg: "com.gobaith.eeue56",
    });
    const page = await webview.page();
    await awaitForTitleToChange(page);

    return { page, runner: { kind: "Android", device } };
  } else if (process.env.IS_ELETRON) {
    const tempUserDir = await mkdtemp("/tmp/gobaith-electron");
    const electronApp = await electron.launch({
      args: ["./electron/main.js", `--user-data-dir=${tempUserDir}`],
    });

    const page = await electronApp.firstWindow();

    return { page, runner: { kind: "Electron", electronApp } };
  }

  const browser = await chromium.launch({ headless: true });

  const page = await browser.newPage({
    screen: { width: 500, height: 1200 },
  });

  await page.goto("http://localhost:8000");

  return {
    page: page,
    runner: { kind: "Chromium", browser },
  };
}

async function main() {
  const { runner, page } = await makePage();
  await setupPage(page);

  const basePath = getBasePath(runner);

  await screenshotDailyTracker(page, basePath);
  await screenshotSettings(page, basePath);
  await screenshotGraphDailyBar(page, basePath);
  await screenshotImporter(page, basePath);
  await screenshotGraphSpiderweb(page, basePath);
  await screenshotGraphLineOverview(page, basePath);
  await screenshotGraphBipolarPeriods(page, basePath);
  await screenshotGraphTotaledBar(page, basePath);
  await screenshotGraphInteractiveQueries(page, basePath);

  switch (runner.kind) {
    case "Electron": {
      await closeElectron(runner.electronApp);
      break;
    }
    case "Android": {
      await runner.device.close();
      break;
    }
    case "Chromium": {
      await runner.browser.close();
      break;
    }
  }
  console.log("done!");
}

main();
