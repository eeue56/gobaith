import {
  test as base,
  BrowserContext,
  _electron as electron,
  Page,
} from "@playwright/test";
import { mkdtempSync } from "fs";
import { mkdtemp } from "fs/promises";
import { awaitForServiceWorker } from "./helpers";

const url = "http://localhost:3003";

export const test = base.extend<Page, BrowserContext>({
  page: async (
    { page, context }: { page: Page; context: BrowserContext },
    use: (r: Page) => Promise<void>
  ): Promise<void> => {
    if (process.env.IS_ELECTRON) {
      const tempUserDir = await mkdtemp("/tmp/gobaith-electron");
      const electronApp = await electron.launch({
        args: ["./electron/main.js", `--user-data-dir=${tempUserDir}`],
      });

      const window = await electronApp.firstWindow();
      await use(window);

      await electronApp.close();
    } else {
      await page.goto(url.toString());
      await awaitForServiceWorker(context);
      await use(page);
    }
  },
});

const persistentElectronPath = `/tmp/gobaith-electron-persist-${new Date().getTime()}`;
const tempUserDir = mkdtempSync(persistentElectronPath);

export const testPeristentElectron = base.extend<Page, BrowserContext>({
  page: async (
    { page, context }: { page: Page; context: BrowserContext },
    use: (r: Page) => Promise<void>
  ): Promise<void> => {
    const electronApp = await electron.launch({
      args: ["./electron/main.js", `--user-data-dir=${tempUserDir}`],
    });

    const window = await electronApp.firstWindow();
    await use(window);

    await electronApp.close();
  },
});
