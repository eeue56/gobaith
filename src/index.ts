import { renderJournal } from "./render/journal";
import { Model, Update } from "./types";

import { renderGraph } from "./render/graphs/index";
import { renderFirstTimeSetup } from "./render/ui/prompt_setup";
import {
  renderImport,
  renderSettings,
  renderTabNavigation,
} from "./render/ui/tabs";
import { getDebuggingInfo } from "./utils/localstorage";

import { div, HtmlNode, Program, program } from "@eeue56/coed";
import { debuggingInfo, fetchModelFromStores, update } from "./update";
import { pushHistoryState } from "./updaters";

/**
 * Call the individual render functions
 */
function renderBody(model: Model): HtmlNode<Update> {
  // Show first-time setup if user hasn't completed it
  if (!model.settings.hasCompletedSetup) {
    return renderFirstTimeSetup();
  }

  switch (model.appState.currentTab) {
    case "JOURNAL": {
      return renderJournal(model);
    }
    case "IMPORT": {
      return renderImport(model);
    }
    case "GRAPH": {
      return renderGraph(model);
    }
    case "SETTINGS": {
      // Use the live debuggingInfo from update.ts instead of reading from localStorage
      return renderSettings(model, debuggingInfo);
    }
  }
}

function render(model: Model): HtmlNode<Update> {
  // Don't show tab navigation during first-time setup
  if (!model.settings.hasCompletedSetup) {
    return div([], [], [renderBody(model)]);
  }

  return div(
    [],
    [],
    [renderBody(model), renderTabNavigation(model.appState.currentTab)]
  );
}

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

let SENDER: ((msg: Update) => void) | null = null;

async function skipOnboarding() {
  if (SENDER) {
    SENDER({ kind: "SelectPromptPack", packName: "Bipolar" });
    console.log("Prompt selected");
  } else {
    console.log("No sender!");
  }
}

async function resetPrompts() {
  if (SENDER) {
    SENDER({ kind: "RemoveSettings" });
    console.log("Reset settings");
  } else {
    console.log("No sender!");
  }
}

// Attach functions to window immediately so tests can wait for them
(window as any).skipOnboarding = skipOnboarding;
(window as any).resetPrompts = resetPrompts;

async function main() {
  console.log("Main: Starting script...");

  let info = getDebuggingInfo();
  if (!info) {
    info = { kind: "DebuggingInfo", eventLog: [] };
  }

  const mainElement = document.getElementById("main");

  if (!mainElement) {
    console.error("Unable to find main element!");
    return;
  }
  mainElement.innerHTML = "";

  console.log("Main: registering update handle");

  const params = new URLSearchParams(window.location.search);
  const model = await fetchModelFromStores(params);

  const programConfig: Program<Model, Update> = {
    initialModel: model,
    view: render,
    update: update,
    root: mainElement,
  };

  const runningProgram = program(programConfig);
  SENDER = runningProgram.send;

  runningProgram.send({ kind: "SetDebuggingInfo", info });

  pushHistoryState(model.appState.currentTab);

  await tryToPersistStorage();

  window.addEventListener("popstate", (event) => {
    console.log(
      `location: ${document.location}, state: ${JSON.stringify(event.state)}`
    );

    runningProgram.send({ kind: "UpdateCurrentTab", tab: event.state.tab });
  });

  console.log("Main: changing document title...");
  document.title = "Mood tracker";
}

main();
