import { cleanData } from "./cleaners";
import { initIndexedDB, syncStateAndSettingsToDatabase } from "./database";
import * as defaultObjects from "./defaultObjects";
import { importDataFromJson, initializeEntryForDay } from "./logic/journal";
import { EqualTo } from "./logic/query/types";
import {
  loadAppStateFromServer,
  loadSettingsFromServer,
  saveToServer,
} from "./saveToServer";
import {
  AppState,
  DebuggingInfo,
  LATEST_DATABASE_VERSION,
  LocalState,
  Model,
  Settings,
  Update,
} from "./types";
import {
  addJournalEntry,
  addPill,
  updateCurrentGraph,
  updateCurrentTab,
  updatePillOrder,
  updatePillValue,
  updatePromptValue,
  updateQuery,
  updateSleepValue,
} from "./updaters";
import { dateToDay, nextDay, previousDay } from "./utils/dates";
import { storeDebuggingInfo } from "./utils/localstorage";

export let hasBackend = false;
export let debuggingInfo: DebuggingInfo = {
  kind: "DebuggingInfo",
  eventLog: [],
};

/**
 * Checks if the server has a healthcheck enabled
 *
 * Limit healthcheck request to 50ms, so that it doesn't block for too long when the server is down.
 *
 * Return true if the response is 200 with a text body of `ok`
 *
 * If the status code is anything other than 200, return false.
 * If the server is unhealthy, then the server-worker won't try to read/write to the server
 */
async function hasHeartbeat(): Promise<boolean> {
  try {
    const healthcheck = await fetch("/healthcheck", {
      signal: AbortSignal.timeout(50),
    });

    if (healthcheck.status !== 200) {
      return false;
    }

    if ((await healthcheck.text()) !== "ok") {
      return false;
    }
  } catch (error) {
    // no backend
    return false;
  }

  return true;
}

async function syncStateAndSettings(
  hasBackend: boolean,
  appState: AppState,
  settings: Settings
): Promise<void> {
  if (hasBackend) {
    await saveToServer(appState, settings);
    await syncStateAndSettingsToDatabase(appState, settings);
  } else {
    await syncStateAndSettingsToDatabase(appState, settings);
  }
}

export async function update(message: Update, model: Model): Promise<Model> {
  console.info("UpdateHandler: received event", message.kind);

  // just ignore debug info if it doesn't exist, to avoid breaking the update loop
  try {
    debuggingInfo.eventLog.push(message.kind);
    storeDebuggingInfo(debuggingInfo);
  } catch (error) {
    console.error(
      "UpdateHandler: unable to add event",
      message.kind,
      "to the event log due to",
      error
    );
  }

  switch (message.kind) {
    case "SetModel": {
      const day = model.appState.day;
      const initResult = initializeEntryForDay(
        day,
        message.model.appState.journalEntries,
        message.model.settings
      );

      switch (initResult.kind) {
        case "CreatedNewEntry": {
          message.model.appState.journalEntries.push(initResult.entry);
          break;
        }
        case "AlreadyFound": {
          break;
        }
      }

      message.model.appState.day = day;

      return {
        appState: message.model.appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "AddJournalEntry": {
      const appState = addJournalEntry(
        message.day,
        message.text,
        message.time,
        model.appState
      );
      await syncStateAndSettings(hasBackend, appState, model.settings);
      return {
        appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "UpdatePromptValue": {
      const appState = updatePromptValue(
        message.entry,
        message.prompt,
        message.newValue,
        model.appState
      );
      await syncStateAndSettings(hasBackend, appState, model.settings);
      return {
        appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "RemoveSettings": {
      const settings: Settings = {
        kind: "Settings",
        currentPills: [],
        queries: [...defaultObjects.DEFAULT_QUERIES],
        databaseVersion: LATEST_DATABASE_VERSION,
      };
      console.log("UpdateHandler: Removed settings");
      await syncStateAndSettings(hasBackend, model.appState, settings);
      return {
        appState: model.appState,
        settings: settings,
        localState: model.localState,
      };
    }
    case "RemoveAppState": {
      const day = dateToDay(new Date());
      const entries = initializeEntryForDay(day, [], model.settings);
      const appState: AppState = {
        kind: "AppState",
        currentTab: "JOURNAL",
        currentGraph: "DAILY_BAR",
        journalEntries: [entries.entry],
        day: day,
        databaseVersion: LATEST_DATABASE_VERSION,
      };
      console.log("UpdateHandler: Removed state");
      await syncStateAndSettings(hasBackend, appState, model.settings);
      return {
        appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "UpdateSleepValue": {
      const entry = message.entry;
      const value = message.value;
      const appState = updateSleepValue(entry, value, model.appState);
      await syncStateAndSettings(hasBackend, appState, model.settings);
      return {
        appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "UpdateCurrentTab": {
      const appState = updateCurrentTab(message.tab, model.appState);
      await syncStateAndSettings(hasBackend, appState, model.settings);
      return {
        appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "UpdateCurrentGraph": {
      const appState = updateCurrentGraph(message.graphName, model.appState);
      await syncStateAndSettings(hasBackend, appState, model.settings);
      return {
        appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "AddPill": {
      const modified = addPill(
        message.pillName,
        model.appState.journalEntries,
        model.settings
      );

      model.appState.journalEntries = modified.entries;
      model.settings = modified.settings;
      await syncStateAndSettings(hasBackend, model.appState, model.settings);
      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "ResetCurrentDay": {
      model.appState.day = dateToDay(new Date());
      await syncStateAndSettings(hasBackend, model.appState, model.settings);
      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "UpdateCurrentDay": {
      const direction = message.direction;

      const day =
        direction === "Next"
          ? nextDay(model.appState.day)
          : previousDay(model.appState.day);

      const initResult = initializeEntryForDay(
        day,
        model.appState.journalEntries,
        model.settings
      );

      switch (initResult.kind) {
        case "CreatedNewEntry": {
          model.appState.journalEntries.push(initResult.entry);
          break;
        }
        case "AlreadyFound": {
          break;
        }
      }

      model.appState.day = day;

      await syncStateAndSettings(hasBackend, model.appState, model.settings);
      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "GoToSpecificDay": {
      model.appState.day = message.entry.day;
      model.appState.currentTab = message.tab;
      await syncStateAndSettings(hasBackend, model.appState, model.settings);
      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "UpdateImportAppState": {
      const appState = cleanData(message.state) as AppState;
      console.log(
        `Imported state with ${appState.journalEntries.length} journal entries`
      );
      await syncStateAndSettings(hasBackend, appState, model.settings);
      return {
        appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "UpdateImportSettings": {
      for (const pill of message.settings.currentPills) {
        if (model.settings.currentPills.includes(pill)) {
          console.log(
            "Skipping import of pill",
            pill,
            "as it's already in the settings"
          );
          continue;
        }
        const modified = addPill(
          pill,
          model.appState.journalEntries,
          model.settings
        );

        model.appState.journalEntries = modified.entries;
        model.settings = modified.settings;

        console.log("Imported pill:", pill);
      }
      console.log("Imported settings");
      await syncStateAndSettings(hasBackend, model.appState, model.settings);
      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "UpdatePillValue": {
      const appState = updatePillValue(
        message.entry,
        message.pillName,
        message.direction,
        model.appState
      );
      await syncStateAndSettings(hasBackend, appState, model.settings);
      return {
        appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "UpdatePillOrder": {
      const settings = updatePillOrder(
        model.settings,
        message.pillName,
        message.direction
      );
      await syncStateAndSettings(hasBackend, model.appState, settings);
      return {
        appState: model.appState,
        settings,
        localState: model.localState,
      };
    }
    case "ReadyToRender": {
      return model;
    }
    case "InitializeDay": {
      const initResult = initializeEntryForDay(
        model.appState.day,
        model.appState.journalEntries,
        model.settings
      );

      switch (initResult.kind) {
        case "CreatedNewEntry": {
          model.appState.journalEntries.push(initResult.entry);
          break;
        }
        case "AlreadyFound": {
          break;
        }
      }
      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "SetDebuggingInfo": {
      debuggingInfo = message.info;
      await syncStateAndSettings(hasBackend, model.appState, model.settings);
      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "SetQueryDuration": {
      const newQueries = updateQuery(
        message.index,
        message.path,
        { kind: "Duration", duration: message.duration },
        model.settings.queries
      );
      model.settings.queries = newQueries;
      await syncStateAndSettingsToDatabase(model.appState, model.settings);
      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "SetPromptChoice": {
      const newQueries = updateQuery(
        message.index,
        message.path,
        { kind: "Prompt", prompt: message.prompt },
        model.settings.queries
      );
      model.settings.queries = newQueries;
      await syncStateAndSettingsToDatabase(model.appState, model.settings);
      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "SetComparisonChoice": {
      const newQueries = updateQuery(
        message.index,
        message.path,
        { kind: "Comparison", comparison: message.comparison },
        model.settings.queries
      );
      model.settings.queries = newQueries;
      await syncStateAndSettingsToDatabase(model.appState, model.settings);

      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "SetMoodValueChoice": {
      const newQueries = updateQuery(
        message.index,
        message.path,
        { kind: "MoodValue", moodValue: message.moodValue },
        model.settings.queries
      );
      model.settings.queries = newQueries;
      await syncStateAndSettingsToDatabase(model.appState, model.settings);

      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "SetCombineQuery": {
      const newQueries = updateQuery(
        message.index,
        message.path,
        { kind: "CombineQuery", combineQueryKind: message.combineQueryKind },
        model.settings.queries
      );
      model.settings.queries = newQueries;
      await syncStateAndSettingsToDatabase(model.appState, model.settings);

      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "AddNewDurationQuery": {
      model.settings.queries.splice(0, 0, {
        kind: "Duration",
        comparison: EqualTo,
        days: 1,
        query: {
          kind: "Filter",
          comparison: EqualTo,
          prompt: "Today's feelings of anxiety",
          value: 1,
        },
      });
      await syncStateAndSettingsToDatabase(model.appState, model.settings);
      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "AddNewFilterQuery": {
      model.settings.queries.splice(0, 0, {
        kind: "Filter",
        comparison: EqualTo,
        prompt: "Today's feelings of anxiety",
        value: 1,
      });
      await syncStateAndSettingsToDatabase(model.appState, model.settings);
      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "DeleteQuery": {
      model.settings.queries.splice(message.index, 1);
      await syncStateAndSettingsToDatabase(model.appState, model.settings);
      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
    case "Noop": {
      return model;
    }
    case "ReadImportedFile": {
      const imported = await updateImportFile(message.target);

      if (imported === null || typeof imported === "string") {
        return model;
      }

      switch (imported.kind) {
        case "AppState": {
          return {
            appState: imported,
            settings: model.settings,
            localState: model.localState,
          };
        }
        case "Settings": {
          return {
            appState: model.appState,
            settings: imported,
            localState: model.localState,
          };
        }
      }
    }
    case "ToggleFilterLineGraphView": {
      const currentNonFilteredPrompts =
        model.localState.Graphs.LineOverview.nonFilteredPrompts;

      if (currentNonFilteredPrompts.has(message.prompt)) {
        model.localState.Graphs.LineOverview.nonFilteredPrompts.delete(
          message.prompt
        );
      } else {
        model.localState.Graphs.LineOverview.nonFilteredPrompts.add(
          message.prompt
        );
      }

      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
      };
    }
  }
}

async function updateImportFile(
  target: HTMLInputElement
): Promise<AppState | Settings | string | null> {
  if (!target) {
    return null;
  }

  if (target.files === null || target.files.length === 0) return null;

  if (target.files[0].name.endsWith(".json")) {
    const fileContents = await target.files[0].text();
    return importDataFromJson(fileContents);
  }

  return null;
}

export async function fetchModelFromStores(): Promise<Model> {
  let appState: AppState = defaultObjects.appState;
  let settings: Settings = defaultObjects.settings;
  const localState: LocalState = defaultObjects.localState;
  const maybeDatabaseRecords = await initIndexedDB();

  hasBackend = await hasHeartbeat();

  if (hasBackend) {
    const [maybeAppState, maybeSettings] = await Promise.all([
      loadAppStateFromServer(),
      loadSettingsFromServer(),
    ]);

    if (typeof maybeAppState === "string") {
      console.error(maybeAppState);

      if (maybeDatabaseRecords) {
        appState = maybeDatabaseRecords.appState;
      }
    } else {
      appState = maybeAppState;
    }

    if (typeof maybeSettings === "string") {
      console.error(maybeSettings);

      if (maybeDatabaseRecords) {
        settings = maybeDatabaseRecords.settings;
      }
    } else {
      settings = maybeSettings;
    }
  } else {
    if (maybeDatabaseRecords !== null) {
      appState = maybeDatabaseRecords.appState;
      settings = maybeDatabaseRecords.settings;
    }
  }

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

  return { appState, settings, localState };
}
