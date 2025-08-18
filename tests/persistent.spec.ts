import { expect } from "@playwright/test";
import { testPeristentElectron } from "./fixtures";
import { changeTab } from "./helpers";

testPeristentElectron.describe.configure({ mode: "serial" });

testPeristentElectron("the user adds a pill", async ({ context, page }) => {
  if (!process.env.IS_ELECTRON) return;
  await changeTab(page, "SETTINGS");

  await page.locator("#new-pill-entry").fill("Paracetamol 100mg");
  await page.locator("#add-pill").click();

  await changeTab(page, "JOURNAL");
  await expect(await page.locator(".journal-pill")).toHaveCount(1);
  await expect(await page.locator(".journal-pill").first()).toContainText(
    "Paracetamol 100mg"
  );
});

testPeristentElectron(
  "the pill is still there after closing/opening electron",
  async ({ context, page }) => {
    if (!process.env.IS_ELECTRON) return;
    // switch between views a couple of times to make sure we've re-rendered since starting electron
    await changeTab(page, "SETTINGS");
    await changeTab(page, "JOURNAL");

    await expect(await page.locator(".journal-pill")).toHaveCount(1);
    await expect(await page.locator(".journal-pill").first()).toContainText(
      "Paracetamol 100mg"
    );
  }
);
