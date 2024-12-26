import {
  AppState,
  DebuggingInfo,
  RenderedWithEvents,
  sendUpdate,
  Sent,
  Settings,
  TabName,
} from "../../types";
import { renderer } from "../../utils/render";
import { renderDebuggingInfo } from "./debugger";
import {
  renderEnterTextToImport,
  renderExportedSettings,
  renderExportedState,
} from "./importer";
import { renderAddPill, renderPillOrder } from "./pills";
import { renderRemoveAppState, renderRemoveSettings } from "./settings";

function renderTabTitle(title: string): string {
  return `
<div class="pure-g">
  <div class="pure-u-1-3"></div>
  <div class="pure-u-1-3"><h2 class="tab-title">${title}</h2></div>
  <div class="pure-u-1-3"></div>
</div>
  `;
}

function renderTabChoice(
  currentTab: TabName,
  choice: TabName,
  label: string
): RenderedWithEvents {
  if (choice === currentTab) {
    return {
      body: `
<button class="pure-button active-tab pure-u-1-4 tab">${label}</button>
`,
      eventListeners: [],
    };
  }
  const id = `tab-button-${label}`;
  return {
    body: `
<button class="pure-button pure-u-1-4 tab" id="${id}">${label}</button>
`,
    eventListeners: [
      {
        elementId: id,
        eventName: "click",
        callback: () => updateCurrentTab(choice),
      },
    ],
  };
}

export function renderTabNavigation(currentTab: TabName): RenderedWithEvents {
  const tabs = [
    renderTabChoice(currentTab, "JOURNAL", "Journal"),
    renderTabChoice(currentTab, "GRAPH", "Graphs"),
    renderTabChoice(currentTab, "IMPORT", "Importer"),
    renderTabChoice(currentTab, "SETTINGS", "Settings"),
  ];

  const tabViews = tabs.map((tab) => tab.body);
  const eventListeners = tabs.map((tab) => tab.eventListeners).flat();

  return {
    body: `
<div class="tabs">
    <div class="pure-g">
      ${tabViews.join("\n")}
    </div>
</div>
`,
    eventListeners: eventListeners,
  };
}

export function renderImport(
  state: AppState,
  settings: Settings
): RenderedWithEvents {
  return renderer`
<div class="tab-content">
  ${renderTabTitle("Import and export data")}
  ${renderEnterTextToImport()}
  ${renderExportedSettings(settings)}
  ${renderExportedState(state)}
</div>
${renderTabNavigation(state.currentTab)}
`;
}

export function renderSettings(
  state: AppState,
  settings: Settings,
  info: DebuggingInfo
): RenderedWithEvents {
  return renderer`
<div class="tab-content">
  ${renderTabTitle("Settings")}
  ${renderRemoveSettings()}
  ${renderRemoveAppState()}
  ${renderPillOrder(settings)}
  ${renderAddPill()}
  ${renderDebuggingInfo(info)}
</div>
${renderTabNavigation(state.currentTab)}
`;
}

function updateCurrentTab(tab: TabName): Sent {
  return sendUpdate({ kind: "UpdateCurrentTab", tab: tab });
}
