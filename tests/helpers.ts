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
  await expect(page).toHaveTitle("Mood tracker", { timeout: 50000 });
}

export async function getActiveTab(page: Page): Promise<string> {
  const tabName = await page.locator(".active-tab").first().innerText();
  return tabName;
}

export async function expectActiveTab(
  page: Page,
  tabName: string
): Promise<void> {
  await expect(await page.locator(".active-tab")).toHaveText(tabName, {
    timeout: 20000,
  });
}
