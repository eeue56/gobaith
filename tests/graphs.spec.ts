import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { changeTab, chooseBipolarPack, expectActiveTab } from "./helpers";

test("the default graph is daily bar", async ({ context, page }) => {
  await chooseBipolarPack(page);
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
  await chooseBipolarPack(page);
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
  await chooseBipolarPack(page);
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
  await chooseBipolarPack(page);
  await changeTab(page, "GRAPH");
  await expectActiveTab(page, "GRAPH");

  await page.locator("#graph-selection").selectOption("Interactive queries");

  await expect(await page.locator(".duration-query-result")).toHaveCount(4);

  await page.locator("#add-duration-query").click();
  await expect(page.locator(".duration-query-result")).toHaveCount(5);

  await page.locator("#add-duration-query").click();
  await expect(page.locator(".duration-query-result")).toHaveCount(6);
});

test("DAILY_BAR row labels are visible on desktop", async ({
  context,
  page,
}) => {
  // Set desktop viewport size
  await page.setViewportSize({ width: 1920, height: 1080 });
  await chooseBipolarPack(page);
  await changeTab(page, "GRAPH");
  await expectActiveTab(page, "GRAPH");

  // Ensure DAILY_BAR is selected
  await expect(await page.locator("#graph-selection")).toHaveValue("DAILY_BAR");

  // Check that all expected row labels are visible
  const expectedLabels = [
    "Sleep",
    "Depression",
    "Anxiety",
    "Elevation",
    "Irrability",
    "Psychotic",
  ];

  for (const label of expectedLabels) {
    const labelElement = page
      .locator(".daily-bar-prompt")
      .filter({ hasText: label });
    await expect(labelElement).toBeVisible();
  }
});

test("SPIDERWEB graph displays SVG content", async ({ context, page }) => {
  await chooseBipolarPack(page);
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
  await chooseBipolarPack(page);
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
  await chooseBipolarPack(page);
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

test("LINE_OVERVIEW graph is responsive on mobile", async ({
  context,
  page,
}) => {
  await chooseBipolarPack(page);
  await page.setViewportSize({ width: 375, height: 667 });

  await changeTab(page, "GRAPH");
  await expectActiveTab(page, "GRAPH");

  await page.selectOption("#graph-selection", "LINE_OVERVIEW");

  const lineContainer = page.locator(".line-overview-container");
  await expect(lineContainer).toBeVisible();

  const svgElement = lineContainer.locator("svg");
  await expect(svgElement).toBeVisible();
});

test("LINE_OVERVIEW graph renders data points when no prompts are filtered", async ({
  context,
  page,
}) => {
  await chooseBipolarPack(page);
  await changeTab(page, "GRAPH");
  await expectActiveTab(page, "GRAPH");

  await page.selectOption("#graph-selection", "LINE_OVERVIEW");

  const lineElement = page.locator("#line-overview");
  await expect(lineElement).toBeVisible();

  const svgContent = lineElement.locator("svg");
  await expect(svgContent).toBeVisible();

  // Check that path elements exist (representing the lines for each prompt)
  const paths = svgContent.locator("path");
  const pathCount = await paths.count();
  expect(pathCount).toBeGreaterThan(0);

  // Check that circles exist (representing data points)
  const circles = svgContent.locator("circle");
  const circleCount = await circles.count();
  expect(circleCount).toBeGreaterThan(0);
});

test("SPIDERWEB graph renders data points", async ({ context, page }) => {
  await chooseBipolarPack(page);
  await changeTab(page, "GRAPH");
  await expectActiveTab(page, "GRAPH");

  await page.selectOption("#graph-selection", "SPIDERWEB");

  const spiderwebElement = page.locator("#spiderweb");
  await expect(spiderwebElement).toBeVisible();

  const svgContent = spiderwebElement.locator("svg");
  await expect(svgContent).toBeVisible();

  // Check that path elements exist (representing the mood data polygon)
  const paths = svgContent.locator("path");
  const pathCount = await paths.count();
  expect(pathCount).toBeGreaterThan(0);

  // Check that circles exist (representing data points at each axis)
  const circles = svgContent.locator("circle");
  const circleCount = await circles.count();
  expect(circleCount).toBeGreaterThan(0);
});

test("LINE_OVERVIEW filtering via clicking legend items", async ({
  context,
  page,
}) => {
  await chooseBipolarPack(page);
  await changeTab(page, "GRAPH");
  await expectActiveTab(page, "GRAPH");

  await page.selectOption("#graph-selection", "LINE_OVERVIEW");

  const lineElement = page.locator("#line-overview");
  await expect(lineElement).toBeVisible();

  const svgContent = lineElement.locator("svg");
  await expect(svgContent).toBeVisible();

  // Get initial path count (all prompts visible)
  const initialPaths = svgContent.locator("path");
  const initialPathCount = await initialPaths.count();
  expect(initialPathCount).toBeGreaterThan(0);

  // Click on a legend item to filter it out
  const legendIcons = svgContent.locator(".legend-color-icon");
  const legendCount = await legendIcons.count();
  expect(legendCount).toBeGreaterThan(0);

  // Click the first legend item to toggle its filter
  await legendIcons.first().click();

  // After filtering, verify the path count changed
  const filteredPathCount = await svgContent.locator("path").count();
  expect(filteredPathCount).toBeLessThan(initialPathCount);

  // Check that the legend icon's stroke changed (indicating it's now filtered)
  const firstLegendIcon = legendIcons.first();
  const strokeWidth = await firstLegendIcon.getAttribute("stroke-width");

  // When filtered, stroke-width should be "3px" (as per the code)
  expect(strokeWidth).toBe("3px");

  // Click again to unfilter
  await legendIcons.first().click();

  // After unfiltering, path count should return to initial
  const unfilteredPathCount = await svgContent.locator("path").count();
  expect(unfilteredPathCount).toBe(initialPathCount);

  // Stroke should return to "1px" when not filtered
  const newStrokeWidth = await firstLegendIcon.getAttribute("stroke-width");
  expect(newStrokeWidth).toBe("1px");
});
