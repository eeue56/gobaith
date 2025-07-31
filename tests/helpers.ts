import { BrowserContext, expect, Page } from "@playwright/test";

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

export async function getActiveTab(page: Page): Promise<string> {
  return await page.locator(".active-tab").first().innerText();
}

export async function expectActiveTab(
  page: Page,
  tabName: string
): Promise<void> {
  await expect(await page.locator(".active-tab")).toHaveText(tabName);
}
