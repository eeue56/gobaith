import {
  attribute,
  button,
  class_,
  div,
  h2,
  HtmlNode,
  on,
  text,
} from "@eeue56/coed";
import { DebuggingInfo, Model, TabName, Update } from "../../types";
import { renderDebuggingInfo } from "./debugger";
import {
  iconAnalytics,
  iconSettings,
  iconTrackChanges,
  iconUpload,
} from "./icons";
import {
  renderEnterTextToImport,
  renderExportedSettings,
  renderExportedState,
} from "./importer";
import { renderAddPill, renderPillOrder } from "./pills";
import { renderRemoveAppState, renderRemoveSettings } from "./settings";

function renderTabTitle(title: string): HtmlNode<never> {
  return div([], [], [h2([], [class_("tab-title")], [text(title)])]);
}

export function getTabButtonId(tabName: TabName): string {
  switch (tabName) {
    case "JOURNAL": {
      return "journal-tab-button";
    }
    case "IMPORT": {
      return "import-tab-button";
    }
    case "GRAPH": {
      return "graph-tab-button";
    }
    case "SETTINGS": {
      return "settings-tab-button";
    }
  }
}

function renderTabChoice(
  currentTab: TabName,
  choice: TabName,
  label: string,
  icon: HtmlNode<never>
): HtmlNode<Update> {
  return button(
    [on("click", () => updateCurrentTab(choice))],
    [
      ...(choice === currentTab ? [class_("active-tab")] : []),
      class_("tab"),
      attribute("id", getTabButtonId(choice)),
    ],
    [text(label), icon]
  );
}

export function renderTabNavigation(currentTab: TabName): HtmlNode<Update> {
  const tabs = [
    renderTabChoice(currentTab, "JOURNAL", "Journal", iconTrackChanges),
    renderTabChoice(currentTab, "GRAPH", "Graphs", iconAnalytics),
    renderTabChoice(currentTab, "IMPORT", "Importer", iconUpload),
    renderTabChoice(currentTab, "SETTINGS", "Settings", iconSettings),
  ];

  return div([], [class_("tabs")], tabs);
}

export function renderImport(model: Model): HtmlNode<Update> {
  return div(
    [],
    [class_("tab-content")],
    [
      div(
        [],
        [class_("import-tab-content")],
        [
          renderTabTitle("Import and export data"),
          renderEnterTextToImport(),
          renderExportedSettings(model.settings),
          renderExportedState(model.appState),
        ]
      ),
    ]
  );
}

export function renderSettings(
  model: Model,
  info: DebuggingInfo
): HtmlNode<Update> {
  return div(
    [],
    [class_("tab-content"), class_("settings-tab-content")],
    [
      renderTabTitle("Settings"),
      renderRemoveSettings(),
      renderRemoveAppState(),
      renderPillOrder(model.settings),
      renderAddPill(),
      renderDebuggingInfo(info),
    ]
  );
}

function updateCurrentTab(tab: TabName): Update {
  return { kind: "UpdateCurrentTab", tab: tab };
}
