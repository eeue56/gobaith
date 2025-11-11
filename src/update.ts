import { cleanData } from "./cleaners";
import { initIndexedDB, loadMigrationTrail, syncStateAndSettingsToDatabase } from "./database";
import * as defaultObjects from "./defaultObjects";
import { initializeEntryForDay } from "./logic/journal";
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
  MigrationTrailEntry,
  Model,
  pillKey,
  PROMPT_PACKS,
  Settings,
  Update,
} from "./types";
import {
  addJournalEntry,
  addPill,
  deletePromptData,
  togglePromptEnabled,
  updateCurrentGraph,
  updateCurrentTab,
  updateImportFile,
  updatePillOrder,
  updatePillValue,
  updatePromptValue,
  updateQuery,
} from "./updaters";
import { dateToDay, nextDay, previousDay } from "./utils/dates";
import { getDebuggingInfo, storeDebuggingInfo } from "./utils/localstorage";

export let hasBackend = false;

/**
 * Initialize debuggingInfo from localStorage if available (browser context only)
 */
function initializeDebuggingInfo(): DebuggingInfo {
  const defaultInfo: DebuggingInfo = {
    kind: "DebuggingInfo",
    eventLog: [],
  };

  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    const storedInfo = getDebuggingInfo();
    if (storedInfo) {
      return storedInfo;
    }
  }

  return defaultInfo;
}

export let debuggingInfo: DebuggingInfo = initializeDebuggingInfo();

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
    debuggingInfo.eventLog.push({
      eventKind: message.kind,
      timestamp: new Date(),
    });
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
        migrationTrail: model.migrationTrail,
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
        migrationTrail: model.migrationTrail,
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
        migrationTrail: model.migrationTrail,
      };
    }
    case "RemoveSettings": {
      const settings: Settings = {
        kind: "Settings",
        currentPills: [],
        queries: [...defaultObjects.DEFAULT_QUERIES],
        databaseVersion: LATEST_DATABASE_VERSION,
        enabledPrompts: new Set(),
        hasCompletedSetup: false,
        customPrompts: [],
      };
      console.log("UpdateHandler: Removed settings");
      await syncStateAndSettings(hasBackend, model.appState, settings);
      return {
        appState: model.appState,
        settings: settings,
        localState: model.localState,
        migrationTrail: model.migrationTrail,
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
        migrationTrail: model.migrationTrail,
      };
    }
    case "UpdateCurrentTab": {
      const appState = updateCurrentTab(message.tab, model.appState);
      await syncStateAndSettings(hasBackend, appState, model.settings);
      return {
        appState,
        settings: model.settings,
        localState: model.localState,
        migrationTrail: model.migrationTrail,
      };
    }
    case "UpdateCurrentGraph": {
      const appState = updateCurrentGraph(message.graphName, model.appState);
      await syncStateAndSettings(hasBackend, appState, model.settings);
      return {
        appState,
        settings: model.settings,
        localState: model.localState,
        migrationTrail: model.migrationTrail,
      };
    }
    case "AddPill": {
      const modified = addPill(
        message.pill,
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
        migrationTrail: model.migrationTrail,
      };
    }
    case "ResetCurrentDay": {
      model.appState.day = dateToDay(new Date());
      await syncStateAndSettings(hasBackend, model.appState, model.settings);
      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
        migrationTrail: model.migrationTrail,
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
        migrationTrail: model.migrationTrail,
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
        migrationTrail: model.migrationTrail,
      };
    }
    case "UpdateImportAppState": {
      const appState = cleanData(message.state) as AppState;
      const entryCount = appState.journalEntries.length;
      console.log(`Imported state with ${entryCount} journal entries`);
      await syncStateAndSettings(hasBackend, appState, model.settings);
      return {
        appState,
        settings: model.settings,
        localState: {
          ...model.localState,
          Importer: {
            status: {
              kind: "Ok",
              value: `Successfully imported state with ${entryCount} journal ${
                entryCount === 1 ? "entry" : "entries"
              }`,
            },
          },
        },
        migrationTrail: model.migrationTrail,
      };
    }
    case "UpdateImportSettings": {
      for (const pill of message.settings.currentPills) {
        const pillKeyValue = pillKey(pill);
        if (
          model.settings.currentPills.some((p) => pillKey(p) === pillKeyValue)
        ) {
          console.log(
            "Skipping import of pill",
            pillKeyValue,
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

        console.log("Imported pill:", pillKeyValue);
      }
      const pillCount = model.settings.currentPills.length;
      console.log("Imported settings");
      await syncStateAndSettings(hasBackend, model.appState, model.settings);
      return {
        appState: model.appState,
        settings: model.settings,
        localState: {
          ...model.localState,
          Importer: {
            status: {
              kind: "Ok",
              value: `Successfully imported settings with ${pillCount} ${
                pillCount === 1 ? "pill" : "pills"
              }`,
            },
          },
        },
        migrationTrail: model.migrationTrail,
      };
    }
    case "SetImportStatus": {
      return {
        appState: model.appState,
        settings: model.settings,
        localState: {
          ...model.localState,
          Importer: { status: message.status },
        },
        migrationTrail: model.migrationTrail,
      };
    }
    case "UpdatePillValue": {
      const appState = updatePillValue(
        message.entry,
        message.pill,
        message.direction,
        model.appState
      );
      await syncStateAndSettings(hasBackend, appState, model.settings);
      return {
        appState,
        settings: model.settings,
        localState: model.localState,
        migrationTrail: model.migrationTrail,
      };
    }
    case "UpdatePillOrder": {
      const settings = updatePillOrder(
        model.settings,
        message.pill,
        message.direction
      );
      await syncStateAndSettings(hasBackend, model.appState, settings);
      return {
        appState: model.appState,
        settings,
        localState: model.localState,
        migrationTrail: model.migrationTrail,
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
        migrationTrail: model.migrationTrail,
      };
    }
    case "SetDebuggingInfo": {
      debuggingInfo = message.info;
      await syncStateAndSettings(hasBackend, model.appState, model.settings);
      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
        migrationTrail: model.migrationTrail,
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
        migrationTrail: model.migrationTrail,
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
        migrationTrail: model.migrationTrail,
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
        migrationTrail: model.migrationTrail,
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
        migrationTrail: model.migrationTrail,
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
        migrationTrail: model.migrationTrail,
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
        migrationTrail: model.migrationTrail,
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
        migrationTrail: model.migrationTrail,
      };
    }
    case "DeleteQuery": {
      model.settings.queries.splice(message.index, 1);
      await syncStateAndSettingsToDatabase(model.appState, model.settings);
      return {
        appState: model.appState,
        settings: model.settings,
        localState: model.localState,
        migrationTrail: model.migrationTrail,
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
        migrationTrail: model.migrationTrail,
          };
        }
        case "Settings": {
          return {
            appState: model.appState,
            settings: imported,
            localState: model.localState,
        migrationTrail: model.migrationTrail,
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
        migrationTrail: model.migrationTrail,
      };
    }
    case "SelectPromptPack": {
      const prompts = PROMPT_PACKS[message.packName];

      const settings = {
        ...model.settings,
        enabledPrompts: new Set(prompts),
        hasCompletedSetup: true,
      };

      await syncStateAndSettings(hasBackend, model.appState, settings);
      return {
        appState: model.appState,
        settings,
        localState: model.localState,
        migrationTrail: model.migrationTrail,
      };
    }
    case "TogglePrompt": {
      const settings = togglePromptEnabled(message.prompt, model.settings);
      await syncStateAndSettings(hasBackend, model.appState, settings);
      return {
        appState: model.appState,
        settings,
        localState: model.localState,
        migrationTrail: model.migrationTrail,
      };
    }
    case "DeletePromptData": {
      const appState = deletePromptData(message.prompt, model.appState);
      await syncStateAndSettings(hasBackend, appState, model.settings);
      return {
        appState,
        settings: model.settings,
        localState: model.localState,
        migrationTrail: model.migrationTrail,
      };
    }
    case "CompleteSetup": {
      const settings = { ...model.settings, hasCompletedSetup: true };
      await syncStateAndSettings(hasBackend, model.appState, settings);
      return {
        appState: model.appState,
        settings,
        localState: model.localState,
        migrationTrail: model.migrationTrail,
      };
    }
    case "AddCustomPrompt": {
      const customPrompts = [
        ...model.settings.customPrompts,
        message.promptText,
      ];
      const settings = { ...model.settings, customPrompts };
      await syncStateAndSettings(hasBackend, model.appState, settings);
      return {
        appState: model.appState,
        settings,
        localState: model.localState,
        migrationTrail: model.migrationTrail,
      };
    }
    case "RemoveCustomPrompt": {
      const customPrompts = model.settings.customPrompts.filter(
        (p) => p !== message.promptText
      );
      const settings = { ...model.settings, customPrompts };
      await syncStateAndSettings(hasBackend, model.appState, settings);
      return {
        appState: model.appState,
        settings,
        localState: model.localState,
        migrationTrail: model.migrationTrail,
      };
    }
    case "DownloadTrailEntry": {
      const fileName = `migration-backup-${message.entry.storeName}-v${message.entry.fromVersion}-to-v${message.entry.toVersion}-${message.entry.timestamp}.json`;
      const blob = new Blob([JSON.stringify(message.entry.data, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      return model;
    }
    case "LoadMigrationTrail": {
      let migrationTrail: MigrationTrailEntry[] = [];
      try {
        migrationTrail = await loadMigrationTrail();
      } catch (error) {
        console.error("Failed to load migration trail:", error);
      }
      return {
        ...model,
        migrationTrail,
      };
    }
  }
}

export async function fetchModelFromStores(
  params: URLSearchParams | null
): Promise<Model> {
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
        appState = { ...appState, ...maybeDatabaseRecords.appState };
      }
    } else {
      appState = { ...appState, ...maybeAppState };
    }

    if (typeof maybeSettings === "string") {
      console.error(maybeSettings);

      if (maybeDatabaseRecords) {
        settings = { ...settings, ...maybeDatabaseRecords.settings };
      }
    } else {
      settings = { ...settings, ...maybeSettings };
    }
  } else {
    if (maybeDatabaseRecords !== null) {
      appState = { ...appState, ...maybeDatabaseRecords.appState };
      settings = { ...settings, ...maybeDatabaseRecords.settings };
    }
  }

  if (params) {
    if (params.get("skipOnboarding") === "true") {
      const prompts = PROMPT_PACKS["Bipolar"];

      settings.enabledPrompts = new Set(prompts);
      settings.hasCompletedSetup = true;
    }

    if (params.get("resetPrompts") === "true") {
      settings.enabledPrompts = new Set();
      settings.hasCompletedSetup = false;
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

  // Load migration trail entries
  let migrationTrail: MigrationTrailEntry[] = [];
  try {
    migrationTrail = await loadMigrationTrail();
  } catch (error) {
    console.error("Failed to load migration trail:", error);
  }

  return { appState, settings, localState, migrationTrail };
}
