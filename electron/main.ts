import { BrowserWindow, app } from "electron";

function createWindow() {
  const window = new BrowserWindow({
    darkTheme: true,
    frame: false,
  });
  window.loadFile("../web/index.html");

  window.maximize();
}

function main() {
  app.whenReady().then(() => {
    createWindow();
  });
}

main();
