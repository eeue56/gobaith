import { test } from "./fixtures";
import { changeTab, expectActiveTab } from "./helpers";

test("the user can switch to the importer tab", async ({ context, page }) => {
  await changeTab(page, "IMPORT");

  await expectActiveTab(page, "IMPORT");
});

test("the user can switch to the graphs tab", async ({ context, page }) => {
  await changeTab(page, "GRAPH");

  await expectActiveTab(page, "GRAPH");
});

test("the user can switch to the settings tab", async ({ context, page }) => {
  await changeTab(page, "SETTINGS");

  await expectActiveTab(page, "SETTINGS");
});

test("the user can use the back button to return to a previous tab", async ({
  context,
  page,
}) => {
  await changeTab(page, "SETTINGS");
  await expectActiveTab(page, "SETTINGS");

  await changeTab(page, "GRAPH");
  await expectActiveTab(page, "GRAPH");

  await page.goBack();

  await expectActiveTab(page, "SETTINGS");
});
