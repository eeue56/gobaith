import { showLineOverview } from "./render/graphs/lineOverview";
import { renderJournal } from "./render/journal";
import {
  AppState,
  RenderBroadcast,
  RenderedWithEvents,
  RenderError,
  sendUpdate,
  Settings,
  TypedBroadcastChannel,
} from "./types";

import { renderGraph } from "./render/graphs/index";
import { showSpiderweb } from "./render/graphs/spiderweb";
import { renderImport, renderSettings } from "./render/ui/tabs";

/**
 * Keep track of last render time to avoid rendering too often
 */
let lastRenderTime = 0;

/**
 * Call the individual render functions
 */
function renderBody(state: AppState, settings: Settings): RenderedWithEvents {
  switch (state.currentTab) {
    case "JOURNAL": {
      return renderJournal(state, settings);
    }
    case "IMPORT": {
      return renderImport(state, settings);
    }
    case "GRAPH": {
      return renderGraph(state, settings);
    }
    case "SETTINGS": {
      return renderSettings(state, settings);
    }
  }
}

/**
 * This is the main render function - it is triggered from the service-worker.
 *
 * State and settings come from the service-worker (via indexeddb)
 *
 * After rendering, this function calls postRender.
 *
 * By default, it logs info on rendering + event attachment time
 */
function render(state: AppState, settings: Settings): void {
  const rightNow = performance.now();
  const diff = rightNow - lastRenderTime;

  // try to avoid re-rendering too much
  if (diff > 5 || lastRenderTime === 0) {
    lastRenderTime = rightNow;
  } else {
    return;
  }

  document.title = "Mood tracker";
  const mainElement = document.getElementById("main");

  console.group("Rendering info");

  if (!mainElement) {
    console.error("Could not find element with id 'main'");
    return;
  }

  try {
    let start = performance.now();
    const body = renderBody(state, settings);
    let end = performance.now();

    console.info("Render time:", end - start);

    mainElement.innerHTML = body.body;

    start = performance.now();

    for (const eventListener of body.eventListeners) {
      const element = document.getElementById(eventListener.elementId);

      if (element) {
        element.addEventListener(
          eventListener.eventName,
          eventListener.callback
        );
      } else {
        console.error(
          "Could not find element with selector '#",
          eventListener.elementId,
          "'"
        );
      }
    }

    end = performance.now();

    console.info("Added", body.eventListeners.length, "listeners");
    console.info("Attachment time:", end - start);
    console.groupEnd();

    postRender(state, settings);
  } catch (error) {
    console.groupEnd();
    if ((error as RenderError) === "NeedsToInitialize") {
      sendUpdate({ kind: "InitializeDay" });
    } else {
      console.error(error);
    }
  }
}

/**
 * This function runs functions that require basic rendering of the DOM first.
 *
 * Currently, it is only Chart.js integrations that require this mechanic.
 */
function postRender(state: AppState, settings: Settings): void {
  if (state.currentTab === "GRAPH") {
    switch (state.currentGraph) {
      case "SPIDERWEB": {
        showSpiderweb(state.day, state.journalEntries);
        break;
      }
      case "LINE_OVERVIEW": {
        showLineOverview(state.journalEntries);
        break;
      }
      case "DAILY_BAR":
      case "BIPOLAR_PERIODS":
      case "TOTALED_DAILY_BAR":
    }
  }
}

/**
 * The channel that the service-worker and the client communicate on.
 */
const renderChannel = TypedBroadcastChannel<RenderBroadcast>("render");
renderChannel.channel.addEventListener(
  "message",
  (event: MessageEvent<RenderBroadcast>) => {
    if (event.data.kind === "rerender") {
      render(event.data.state, event.data.settings);
    }
  }
);

async function tryToPersistStorage(): Promise<void> {
  return navigator.storage.persist().then((persistent) => {
    if (persistent) {
      console.log("Storage will not be cleared except by explicit user action");
    } else {
      console.warn(
        "Client-side storage may be cleared under storage pressure."
      );
    }
  });
}

/**
 * Since most of the logic regarding state is handled in the service-worker, this
 * app currently requires a service-worker.
 */
function attachServiceWorker(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    if (navigator.storage && "persist" in navigator.storage) {
      await tryToPersistStorage();
    }

    if (!("serviceWorker" in navigator)) {
      console.error("Unable to register service worker");
      reject("No such serviceWorker in navigator");
      return;
    }

    await navigator.serviceWorker
      .register("service-worker.js", {
        scope: "./",
      })
      .then((registration) => {
        let serviceWorker;
        if (registration.installing) {
          serviceWorker = registration.installing;
        } else if (registration.waiting) {
          serviceWorker = registration.waiting;
        } else if (registration.active) {
          serviceWorker = registration.active;
        }
        if (serviceWorker) {
          resolve();
          return;
        }
        reject("Did not register service worker");
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}

async function main() {
  await attachServiceWorker();
  sendUpdate({ kind: "ReadyToRender" });
}

main();
