import { showLineOverview } from "./render/graphs/lineOverview";
import { renderJournal } from "./render/journal";
import { DebuggingInfo, GraphName, Model, Update } from "./types";

import type { Chart } from "chart.js";
import { renderGraph } from "./render/graphs/index";
import { showSpiderweb } from "./render/graphs/spiderweb";
import {
  renderImport,
  renderSettings,
  renderTabNavigation,
} from "./render/ui/tabs";
import { getDebuggingInfo } from "./utils/localstorage";

import { div, HtmlNode, Program, program } from "@eeue56/coed";
import { fetchModelFromStores, update } from "./update";
import { pushHistoryState } from "./updaters";

type ActiveChart = {
  graphName: GraphName;
  chart: Chart<any, any>;
};

/**
 * Track the active chart so we can call destroy on it when tabs change
 */
let activeChart: ActiveChart | null = null;

/**
 * Call the individual render functions
 */
function renderBody(model: Model): HtmlNode<Update> {
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
      let info: DebuggingInfo | null = getDebuggingInfo();
      if (!info) {
        info = { kind: "DebuggingInfo", eventLog: [] };
      }
      return renderSettings(model, info);
    }
  }
}

function render(model: Model): HtmlNode<Update> {
  return div(
    [],
    [],
    [renderBody(model), renderTabNavigation(model.appState.currentTab)]
  );
}

/**
 * This function runs functions that require basic rendering of the DOM first.
 *
 * Currently, it is only Chart.js integrations that require this mechanic.
 */
function postRender(model: Model): void {
  if (model.appState.currentTab === "GRAPH") {
    if (activeChart !== null) {
      if (activeChart.graphName !== model.appState.currentGraph) {
        activeChart.chart.destroy();
        activeChart = null;
      }
    }
    switch (model.appState.currentGraph) {
      case "SPIDERWEB": {
        showSpiderweb(model.appState.day, model.appState.journalEntries);
        break;
      }
      case "LINE_OVERVIEW": {
        showLineOverview(model.appState.journalEntries);
        break;
      }
      case "DAILY_BAR":
      case "BIPOLAR_PERIODS":
      case "TOTALED_DAILY_BAR":
    }
  } else {
    if (activeChart !== null) {
      activeChart.chart.destroy();
      activeChart = null;
    }
  }
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

async function main() {
  console.log("Main: Starting script...");

  console.log("Main: changing document title...");
  document.title = "Mood tracker";

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
  const model = await fetchModelFromStores();

  const programConfig: Program<Model, Update> = {
    initialModel: model,
    view: render,
    update: update,
    root: mainElement,
    postRender: postRender,
  };

  const runningProgram = program(programConfig);

  runningProgram.send({ kind: "SetDebuggingInfo", info });

  pushHistoryState(model.appState.currentTab);

  await tryToPersistStorage();

  window.addEventListener("popstate", (event) => {
    console.log(
      `location: ${document.location}, state: ${JSON.stringify(event.state)}`
    );

    runningProgram.send({ kind: "UpdateCurrentTab", tab: event.state.tab });
  });
}

main();
