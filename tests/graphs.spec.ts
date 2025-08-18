import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { changeTab, expectActiveTab } from "./helpers";

test("the default graph is daily bar", async ({ context, page }) => {
  await changeTab(page, "GRAPH");

  await expect(await page.locator("#graph-selection")).toHaveValue("DAILY_BAR");

  await expect(
    (
      await page.locator(".daily-bar").all()
    ).length
  ).toBeGreaterThanOrEqual(5);
});

test("the user can click a daily bar to go to that day", async ({
  context,
  page,
}) => {
  await changeTab(page, "GRAPH");

  await expect(await page.locator("#graph-selection")).toHaveValue("DAILY_BAR");

  await expect(
    (
      await page.locator(".daily-bar").all()
    ).length
  ).toBeGreaterThanOrEqual(5);

  const barToClick = await page.locator(".daily-bar").first();
  const title = (await barToClick.getAttribute("title")) || "ERROR";

  await barToClick.click();

  await expectActiveTab(page, "Journal");
  await expect(await page.locator(".current-day").first()).toContainText(title);
});

test("the user sees some filter information", async ({ context, page }) => {
  await changeTab(page, "GRAPH");
  await expectActiveTab(page, "Graphs");

  await page.locator("#graph-selection").selectOption("Interactive queries");

  await expect(await page.locator(".filter-query-result")).toHaveCount(2);

  await page.locator("#add-filter-query").click();
  await expect(await page.locator(".filter-query-result")).toHaveCount(3);

  await page.locator("#add-filter-query").click();
  await expect(await page.locator(".filter-query-result")).toHaveCount(4);
});

test("the user sees some duration information", async ({ context, page }) => {
  await changeTab(page, "GRAPH");
  await expectActiveTab(page, "Graphs");

  await page.locator("#graph-selection").selectOption("Interactive queries");

  await expect(await page.locator(".duration-query-result")).toHaveCount(4);

  await page.locator("#add-duration-query").click();
  await expect(page.locator(".duration-query-result")).toHaveCount(5);

  await page.locator("#add-duration-query").click();
  await expect(page.locator(".duration-query-result")).toHaveCount(6);
});
