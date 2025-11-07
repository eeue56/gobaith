import {
  _android as android,
  test as base,
  BrowserContext,
  _electron as electron,
  Page,
} from "@playwright/test";
import { mkdtempSync } from "fs";
import { mkdtemp, rm } from "fs/promises";
import { awaitForTitleToChange } from "./helpers";

async function sendSkipOnboarding(page: Page): Promise<void> {
  await page.evaluate(() => (window as any).skipOnboarding());
}

export const test = base.extend<Page, BrowserContext>({
  page: async (
    {
      page,
      context,
      baseURL,
    }: {
      page: Page;
      context: BrowserContext;
      baseURL: string | undefined;
    },
    use: (r: Page) => Promise<void>
  ): Promise<void> => {
    if (process.env.IS_ELECTRON) {
      const tempUserDir = await mkdtemp("/tmp/gobaith-electron");
      const electronApp = await electron.launch({
        args: ["./electron/main.js", `--user-data-dir=${tempUserDir}`],
      });

      const window = await electronApp.firstWindow();
      await sendSkipOnboarding(page);
      await use(window);

      await electronApp.close();
      return;
    } else if (process.env.IS_ANDROID) {
      const devices = await android.devices();

      const [device] = devices;
      await device.installApk(
        "/home/noah/dev/mental-health-tracker/android/app/build/outputs/apk/debug/app-debug.apk"
      );
      console.log("clearing...");
      await device.shell("pm clear com.gobaith.eeue56");
      await device.shell("am start com.gobaith.eeue56/.MainActivity");

      const webview = await device.webView({
        pkg: "com.gobaith.eeue56",
      });
      const page = await webview.page();
      await awaitForTitleToChange(page);
      await sendSkipOnboarding(page);
      await use(page);

      return;
    }

    if (baseURL?.endsWith("8013")) {
      const BACKEND_STORE_DIRECTORY = "backend-state";
      await rm(`${BACKEND_STORE_DIRECTORY}/state.json`, { force: true });
      await rm(`${BACKEND_STORE_DIRECTORY}/settings.json`, { force: true });
    }
    await page.goto(baseURL || "");
    await awaitForTitleToChange(page);
    await sendSkipOnboarding(page);
    await use(page);
  },
});

const persistentElectronPath = `/tmp/gobaith-electron-persist`;
const tempUserDir = mkdtempSync(persistentElectronPath);

export const testPeristentElectron = base.extend<Page, BrowserContext>({
  page: async (
    { page, context }: { page: Page; context: BrowserContext },
    use: (r: Page) => Promise<void>
  ): Promise<void> => {
    if (!process.env.IS_ELECTRON) {
      await use(page);
      return;
    }

    const electronApp = await electron.launch({
      args: ["./electron/main.js", `--user-data-dir=${tempUserDir}`],
    });

    const window = await electronApp.firstWindow();
    await use(window);

    await electronApp.close();
  },
});
