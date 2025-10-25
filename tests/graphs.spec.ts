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
  ).toBeGreaterThanOrEqual(6);
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
  ).toBeGreaterThanOrEqual(6);

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

test("SPIDERWEB graph displays SVG content", async ({ context, page }) => {
  await changeTab(page, "GRAPH");
  await expectActiveTab(page, "GRAPH");

  await page.selectOption("#graph-selection", "SPIDERWEB");

  const spiderwebElement = page.locator("#spiderweb");
  await expect(spiderwebElement).toBeVisible();

  const svgContent = spiderwebElement.locator("svg");
  await expect(svgContent).toBeVisible();

  const svgText = await svgContent.innerHTML();
  expect(svgText).toContain("Mood breakdown on");
});

test("SPIDERWEB graph is responsive on mobile", async ({ context, page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  
  await changeTab(page, "GRAPH");
  await expectActiveTab(page, "GRAPH");

  await page.selectOption("#graph-selection", "SPIDERWEB");

  const spiderwebContainer = page.locator(".spiderweb-container");
  await expect(spiderwebContainer).toBeVisible();

  const svgElement = spiderwebContainer.locator("svg");
  await expect(svgElement).toBeVisible();
});

test("LINE_OVERVIEW graph displays SVG content", async ({ context, page }) => {
  await changeTab(page, "GRAPH");
  await expectActiveTab(page, "GRAPH");

  await page.selectOption("#graph-selection", "LINE_OVERVIEW");

  const lineElement = page.locator("#line-overview");
  await expect(lineElement).toBeVisible();

  const svgContent = lineElement.locator("svg");
  await expect(svgContent).toBeVisible();

  const svgText = await svgContent.innerHTML();
  expect(svgText).toContain("Mood Overview Over Time");
});

test("LINE_OVERVIEW graph is responsive on mobile", async ({ context, page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  
  await changeTab(page, "GRAPH");
  await expectActiveTab(page, "GRAPH");

  await page.selectOption("#graph-selection", "LINE_OVERVIEW");

  const lineContainer = page.locator(".line-overview-container");
  await expect(lineContainer).toBeVisible();

  const svgElement = lineContainer.locator("svg");
  await expect(svgElement).toBeVisible();
});

