import { BrowserContext, expect, Page } from "@playwright/test";
import { getTabButtonId } from "../src/render/ui/tabs";
import { TabName } from "../src/types";

export async function awaitForServiceWorker(context: BrowserContext) {
  await expect
    .poll(
      async () => {
        const workers = context.serviceWorkers();
        return workers.length > 0;
      },
      { timeout: 10000 }
    )
    .toBe(true);
}

export async function awaitForTitleToChange(page: Page): Promise<void> {
  await expect(page).toHaveTitle("Mood tracker");
}

export async function changeTab(page: Page, tabName: TabName): Promise<void> {
  const id = getTabButtonId(tabName);
  await page.locator(`#${id}`).click();
}

export async function getActiveTab(page: Page): Promise<string> {
  return await page.locator(".active-tab").first().innerText();
}

function matchTabNameToText(tabName: TabName): string {
  switch (tabName) {
    case "JOURNAL": {
      return "Journal";
    }
    case "IMPORT": {
      return "Importer";
    }
    case "GRAPH": {
      return "Graphs";
    }
    case "SETTINGS": {
      return "Settings";
    }
  }
}

export async function expectActiveTab(
  page: Page,
  tabName: TabName
): Promise<void> {
  const tabText = matchTabNameToText(tabName);
  await expect(await page.locator(".active-tab")).toHaveText(
    new RegExp(tabText)
  );
}

export async function chooseBipolarPack(page: Page): Promise<void> {
  await page.locator(`#select-pack-Bipolar`).click();
  await expect(page.locator(".tabs")).toBeVisible({ timeout: 10000 });
}

export async function resetPrompts(page: Page): Promise<void> {
  if (process.env.IS_ELECTRON) {
    await changeTab(page, "SETTINGS");
    await page.locator("#remove-all-settings").click();
    await expect(page.locator(".first-time-setup")).toBeVisible();
    return;
  }
  await page.evaluate(() => (window as any).resetPrompts());
}
