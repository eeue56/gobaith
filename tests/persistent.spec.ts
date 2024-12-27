import { expect } from "@playwright/test";
import { testPeristentElectron } from "./fixtures";

testPeristentElectron.describe.configure({ mode: "serial" });

testPeristentElectron("the user adds a pill", async ({ context, page }) => {
  if (!process.env.IS_ELECTRON) return;
  await page.locator('.tab:text("Settings")').click();

  await page.locator("#new-pill-entry").fill("Paracetamol 100mg");
  await page.locator("#add-pill").click();

  await page.locator('.tab:text("Journal")').click();
  await expect((await page.locator(".journal-pill").all()).length).toEqual(1);
  await expect(await page.locator(".journal-pill").first()).toContainText(
    "Paracetamol 100mg"
  );
});

testPeristentElectron(
  "the pill is still there after closing/opening electron",
  async ({ context, page }) => {
    if (!process.env.IS_ELECTRON) return;
    // switch between views a couple of times to make sure we've re-rendered since starting electron
    await page.locator('.tab:text("Settings")').click();
    await page.locator('.tab:text("Journal")').click();

    await expect((await page.locator(".journal-pill").all()).length).toEqual(1);
    await expect(await page.locator(".journal-pill").first()).toContainText(
      "Paracetamol 100mg"
    );
  }
);
