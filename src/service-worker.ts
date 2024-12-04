import {
  loadSettingsFromDatabase,
  loadStateToDatabase,
  openDatabase,
  syncSettingsToDatabase,
  syncStateToDatabase,
} from "./database";
import { initializeEntryForDay } from "./logic/journal";
import {
  AppState,
  isAppState,
  isSettings,
  RenderBroadcast,
  Settings,
  TypedBroadcastChannel,
  Update,
} from "./types";
import {
  addJournalEntry,
  addPill,
  nextDay,
  previousDay,
  updateCurrentGraph,
  updateCurrentTab,
  updatePillOrder,
  updatePillValue,
  updatePromptValue,
  updateSleepValue,
} from "./updaters";
import { dateToDay } from "./utils/dates";

const renderChannel = TypedBroadcastChannel<RenderBroadcast>("render");

let appState: AppState = {
  kind: "AppState",
  currentTab: "JOURNAL",
  currentGraph: "DAILY_BAR",
  journalEntries: [],
  day: dateToDay(new Date()),
};

let settings: Settings = {
  kind: "Settings",
  currentPills: [],
};

const initResult = initializeEntryForDay(
  dateToDay(new Date()),
  appState.journalEntries,
  settings
);

switch (initResult.kind) {
  case "CreatedNewEntry": {
    appState.journalEntries.push(initResult.entry);
    break;
  }
  case "AlreadyFound": {
    break;
  }
}

function syncToDatabase(state: AppState, settings: Settings): void {
  syncSettingsToDatabase(settings);
  syncStateToDatabase(state);

  // we send to the database, but don't block on response
  try {
    saveSettingsToServer(settings);
    saveAppStateToServer(state);
  } catch (error) {}
}

function sendRerender(state: AppState, settings: Settings): number {
  renderChannel.postMessage({
    kind: "rerender",
    state: state,
    settings: settings,
  });
  return 0;
}

function update(event: MessageEvent<Update>): number {
  const data = event.data;

  switch (data.kind) {
    case "AddJournalEntry": {
      appState = addJournalEntry(data.day, data.text, data.time, appState);
      syncToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "UpdatePromptValue": {
      appState = updatePromptValue(
        data.entry,
        data.prompt,
        data.newValue,
        appState
      );
      syncToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "RemoveSettings": {
      settings = {
        kind: "Settings",
        currentPills: [],
      };
      console.log("Removed settings");
      syncToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "RemoveAppState": {
      appState = {
        kind: "AppState",
        currentTab: "JOURNAL",
        currentGraph: "DAILY_BAR",
        journalEntries: [],
        day: dateToDay(new Date()),
      };
      console.log("Removed state");
      syncToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "UpdateSleepValue": {
      const entry = data.entry;
      const value = data.value;
      appState = updateSleepValue(entry, value, appState);
      syncToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "UpdateCurrentTab": {
      appState = updateCurrentTab(data.tab, appState);
      syncToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "UpdateCurrentGraph": {
      appState = updateCurrentGraph(data.graphName, appState);
      syncToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "AddPill": {
      const modified = addPill(
        data.pillName,
        appState.journalEntries,
        settings
      );

      appState.journalEntries = modified.entries;
      settings = modified.settings;
      syncToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "ResetCurrentDay": {
      appState.day = dateToDay(new Date());
      syncToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "UpdateCurrentDay": {
      const direction = data.direction;

      const day =
        direction === "Next"
          ? nextDay(appState.day)
          : previousDay(appState.day);

      const initResult = initializeEntryForDay(
        day,
        appState.journalEntries,
        settings
      );

      switch (initResult.kind) {
        case "CreatedNewEntry": {
          appState.journalEntries.push(initResult.entry);
          break;
        }
        case "AlreadyFound": {
          break;
        }
      }

      appState.day = day;

      syncToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "GoToSpecificDay": {
      appState.day = data.entry.day;
      appState.currentTab = data.tab;
      syncToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "UpdateImportAppState": {
      appState = data.state;
      console.log(
        `Imported state with ${appState.journalEntries.length} journal entries`
      );
      syncToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "UpdateImportSettings": {
      for (const pill of data.settings.currentPills) {
        if (settings.currentPills.includes(pill)) {
          console.log(
            "Skipping import of pill",
            pill,
            "as it's already in the settings"
          );
          continue;
        }
        const modified = addPill(pill, appState.journalEntries, data.settings);

        appState.journalEntries = modified.entries;

        console.log("Imported pill:", pill);
      }
      console.log("Imported settings");

      syncToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "UpdatePillValue": {
      appState = updatePillValue(
        data.entry,
        data.pillName,
        data.direction,
        appState
      );
      syncToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "UpdatePillOrder": {
      settings = updatePillOrder(settings, data.pillName, data.direction);
      syncToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "ReadyToRender": {
      return sendRerender(appState, settings);
    }
    case "InitializeDay": {
      const initResult = initializeEntryForDay(
        appState.day,
        appState.journalEntries,
        settings
      );

      switch (initResult.kind) {
        case "CreatedNewEntry": {
          appState.journalEntries.push(initResult.entry);
          break;
        }
        case "AlreadyFound": {
          break;
        }
      }
      return sendRerender(appState, settings);
    }
  }
}

renderChannel.channel.addEventListener("message", update);

async function loadSettingsFromServer(): Promise<Settings | string> {
  const response = await fetch("/load/Settings");

  if (response.status === 404) {
    // probably means there's no backend, so ignore
    return "No backend";
  }
  const settings = await response.json();

  if (isSettings(settings)) {
    return settings;
  }

  console.error(settings);
  return "Failed to load settings";
}

async function loadAppStateFromServer(): Promise<AppState | string> {
  const response = await fetch("/load/AppState");

  if (response.status === 404) {
    // probably means there's no backend, so ignore
    return "No backend";
  }

  const settings = await response.json();

  if (isAppState(settings)) {
    return settings;
  }

  console.error(settings);
  return "Failed to load AppState";
}

async function saveSettingsToServer(settings: Settings): Promise<void> {
  const serverResponse = await fetch("/save/Settings", {
    method: "POST",
    body: JSON.stringify(settings),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (serverResponse.status === 501) {
    // probably means there's no backend, so ignore
    return;
  }

  if (serverResponse.status !== 200) {
    console.error("Server response:", serverResponse.status);
    console.error(await serverResponse.text());
  }
}

async function saveAppStateToServer(state: AppState): Promise<void> {
  const serverResponse = await fetch("/save/AppState", {
    method: "POST",
    body: JSON.stringify(state),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (serverResponse.status === 501) {
    // probably means there's no backend, so ignore
    return;
  }

  if (serverResponse.status !== 200) {
    console.error("Server response:", serverResponse.status);
    console.error(await serverResponse.text());
  }
}

async function initDatabase(shouldLoadFromBackend: boolean) {
  await openDatabase();

  if (shouldLoadFromBackend) {
    try {
      // if there's no settings in the local database, then try the server instead
      Promise.all([
        loadSettingsFromServer()
          .then((maybeServerSettings) => {
            if (typeof maybeServerSettings !== "string") {
              settings = maybeServerSettings;
              return settings;
            }
            return maybeServerSettings;
          })
          .catch((error) => initDatabase(false)),
        loadAppStateFromServer()
          .then((maybeServerState) => {
            if (typeof maybeServerState !== "string") {
              appState = maybeServerState;
              return appState;
            }
            return maybeServerState;
          })
          .catch((error) => initDatabase(false)),
      ]).then(([settings, appState]) => {
        if (
          settings &&
          appState &&
          typeof settings !== "string" &&
          typeof appState !== "string"
        ) {
          sendRerender(appState, settings);
        }
      });
    } catch (error) {
      console.error(error);
    }
  } else {
    try {
      const maybeSettings = await loadSettingsFromDatabase();

      if (maybeSettings) {
        settings = maybeSettings;
      }

      const maybeState = await loadStateToDatabase();

      if (maybeState) {
        appState = maybeState;
      }

      sendRerender(appState, settings);
    } catch (error) {
      console.error("Error:", error);
    }
  }
}

self.addEventListener("install", async function (e) {
  console.info("Install event:", e);
  let shouldLoadFromBackend = true;

  try {
    const healthcheck = await fetch("/healthcheck", {
      signal: AbortSignal.timeout(50),
    });

    if (healthcheck.status !== 200) {
      shouldLoadFromBackend = false;
    }
  } catch (error) {
    // no backend
    shouldLoadFromBackend = false;
  }

  await initDatabase(shouldLoadFromBackend);
});

self.addEventListener("activate", async function (e) {
  console.info("Activate event:", e);
  await initDatabase(false);
});
