import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { getActiveTab } from "./helpers";

test("the default graph is daily bar", async ({ context, page }) => {
  await page.locator('.tab:text("Graphs")').click();

  await expect(await page.locator("#graph-selection").inputValue()).toEqual(
    "DAILY_BAR"
  );

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
  await page.locator('.tab:text("Graphs")').click();

  await expect(await page.locator("#graph-selection").inputValue()).toEqual(
    "DAILY_BAR"
  );

  await expect(
    (
      await page.locator(".daily-bar").all()
    ).length
  ).toBeGreaterThanOrEqual(5);

  const barToClick = await page.locator(".daily-bar").first();
  const title = (await barToClick.getAttribute("title")) || "ERROR";

  await barToClick.click();

  await expect(await getActiveTab(page)).toBe("Journal");
  await expect(await page.locator(".current-day").first()).toContainText(title);
});

test("the user sees some filter information", async ({ context, page }) => {
  await page.locator('.tab:text("Graphs")').click();

  await page.locator("#graph-selection").selectOption("Interactive queries");

  const numberOfDurationsBefore = (
    await page.locator(".filter-query-result").all()
  ).length;
  expect(numberOfDurationsBefore).toBeGreaterThan(1);

  await page.locator("#add-filter-query").click();
  await page.locator("#add-filter-query").click();

  expect((await page.locator(".filter-query-result").all()).length).toEqual(
    numberOfDurationsBefore + 2
  );
});

test("the user sees some duration information", async ({ context, page }) => {
  await page.locator('.tab:text("Graphs")').click();

  await page.locator("#graph-selection").selectOption("Interactive queries");

  const numberOfDurationsBefore = (
    await page.locator(".duration-query-result").all()
  ).length;
  expect(numberOfDurationsBefore).toBeGreaterThan(1);

  await page.locator("#add-duration-query").click();
  await page.locator("#add-duration-query").click();

  expect((await page.locator(".duration-query-result").all()).length).toEqual(
    numberOfDurationsBefore + 2
  );
});
