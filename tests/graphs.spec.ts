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

  await expectActiveTab(page, "JOURNAL");
  await expect(await page.locator(".current-day").first()).toContainText(title);
});

test("the user sees some filter information", async ({ context, page }) => {
  await changeTab(page, "GRAPH");
  await expectActiveTab(page, "GRAPH");

  await page.locator("#graph-selection").selectOption("Interactive queries");

  await expect(await page.locator(".filter-query-result")).toHaveCount(2);

  await page.locator("#add-filter-query").click();
  await expect(await page.locator(".filter-query-result")).toHaveCount(3);

  await page.locator("#add-filter-query").click();
  await expect(await page.locator(".filter-query-result")).toHaveCount(4);
});

test("the user sees some duration information", async ({ context, page }) => {
  await changeTab(page, "GRAPH");
  await expectActiveTab(page, "GRAPH");

  await page.locator("#graph-selection").selectOption("Interactive queries");

  await expect(await page.locator(".duration-query-result")).toHaveCount(4);

  await page.locator("#add-duration-query").click();
  await expect(page.locator(".duration-query-result")).toHaveCount(5);

  await page.locator("#add-duration-query").click();
  await expect(page.locator(".duration-query-result")).toHaveCount(6);
});

test("DAILY_BAR row labels are visible on desktop", async ({ context, page }) => {
  // Set desktop viewport size
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  await changeTab(page, "GRAPH");
  await expectActiveTab(page, "GRAPH");

  // Ensure DAILY_BAR is selected
  await expect(await page.locator("#graph-selection")).toHaveValue("DAILY_BAR");

  // Check that all expected row labels are visible
  const expectedLabels = ["Sleep", "Depression", "Anxiety", "Elevation", "Irrability", "Psychotic"];
  
  for (const label of expectedLabels) {
    const labelElement = page.locator(".daily-bar-prompt").filter({ hasText: label });
    await expect(labelElement).toBeVisible();
  }
});

