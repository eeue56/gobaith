import { cleanData } from "./cleaners";
import { initIndexedDB, syncStateAndSettingsToDatabase } from "./database";
import * as defaultObjects from "./defaultObjects";
import { initializeEntryForDay } from "./logic/journal";
import { EqualTo } from "./logic/query/types";
import {
  AppState,
  DebuggingInfo,
  LATEST_DATABASE_VERSION,
  RenderBroadcast,
  Settings,
  TypedBroadcastChannel,
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

const renderChannel: TypedBroadcastChannel<RenderBroadcast> =
  TypedBroadcastChannel<RenderBroadcast>("render");

export let hasBackend = false;
export let appState = defaultObjects.appState;
export let settings = defaultObjects.settings;
export let debuggingInfo: DebuggingInfo = {
  kind: "DebuggingInfo",
  eventLog: [],
};

/**
 * Checks if the server has a healthcheck enabled
 *
 * Limit healthcheck request to 50ms, so that it doesn't block for too long when the server is down.
 *
 * If the status code is anything other than 200, return false
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
  } catch (error) {
    // no backend
    return false;
  }

  return true;
}

export function sendRerender(state: AppState, settings: Settings): number {
  if (!renderChannel) return -1;
  renderChannel.postMessage({
    kind: "rerender",
    state: state,
    settings: settings,
    debuggingInfo: debuggingInfo,
  });
  return 0;
}

export async function update(event: MessageEvent<Update>): Promise<number> {
  const data = event.data;
  console.info("UpdateHandler: received event", data.kind);

  // just ignore debug info if it doesn't exist, to avoid breaking the update loop
  try {
    debuggingInfo.eventLog.push(data.kind);
  } catch (error) {
    console.error(
      "UpdateHandler: unable to add event",
      data.kind,
      "to the event log due to",
      error
    );
  }

  switch (data.kind) {
    case "AddJournalEntry": {
      appState = addJournalEntry(data.day, data.text, data.time, appState);
      await syncStateAndSettingsToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "UpdatePromptValue": {
      appState = updatePromptValue(
        data.entry,
        data.prompt,
        data.newValue,
        appState
      );
      await syncStateAndSettingsToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "RemoveSettings": {
      settings = {
        kind: "Settings",
        currentPills: [],
        queries: [...defaultObjects.DEFAULT_QUERIES],
        databaseVersion: LATEST_DATABASE_VERSION,
      };
      console.log("UpdateHandler: Removed settings");
      await syncStateAndSettingsToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "RemoveAppState": {
      appState = {
        kind: "AppState",
        currentTab: "JOURNAL",
        currentGraph: "DAILY_BAR",
        journalEntries: [],
        day: dateToDay(new Date()),
        databaseVersion: LATEST_DATABASE_VERSION,
      };
      console.log("UpdateHandler: Removed state");
      await syncStateAndSettingsToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "UpdateSleepValue": {
      const entry = data.entry;
      const value = data.value;
      appState = updateSleepValue(entry, value, appState);
      await syncStateAndSettingsToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "UpdateCurrentTab": {
      appState = updateCurrentTab(data.tab, appState);
      await syncStateAndSettingsToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "UpdateCurrentGraph": {
      appState = updateCurrentGraph(data.graphName, appState);
      await syncStateAndSettingsToDatabase(appState, settings);
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
      await syncStateAndSettingsToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "ResetCurrentDay": {
      appState.day = dateToDay(new Date());
      await syncStateAndSettingsToDatabase(appState, settings);
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

      await syncStateAndSettingsToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "GoToSpecificDay": {
      appState.day = data.entry.day;
      appState.currentTab = data.tab;
      await syncStateAndSettingsToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "UpdateImportAppState": {
      appState = cleanData(data.state) as AppState;
      console.log(
        `Imported state with ${appState.journalEntries.length} journal entries`
      );
      await syncStateAndSettingsToDatabase(appState, settings);
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
        const modified = addPill(pill, appState.journalEntries, settings);

        appState.journalEntries = modified.entries;
        settings = modified.settings;

        console.log("Imported pill:", pill);
      }
      console.log("Imported settings");
      await syncStateAndSettingsToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "UpdatePillValue": {
      appState = updatePillValue(
        data.entry,
        data.pillName,
        data.direction,
        appState
      );
      await syncStateAndSettingsToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "UpdatePillOrder": {
      settings = updatePillOrder(settings, data.pillName, data.direction);
      await syncStateAndSettingsToDatabase(appState, settings);
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
    case "SetDebuggingInfo": {
      debuggingInfo = data.info;
      await syncStateAndSettingsToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "SetQueryDuration": {
      const newQueries = updateQuery(
        data.index,
        data.path,
        { kind: "Duration", duration: data.duration },
        settings.queries
      );
      settings.queries = newQueries;
      await syncStateAndSettingsToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "SetPromptChoice": {
      const newQueries = updateQuery(
        data.index,
        data.path,
        { kind: "Prompt", prompt: data.prompt },
        settings.queries
      );
      settings.queries = newQueries;
      await syncStateAndSettingsToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "SetComparisonChoice": {
      const newQueries = updateQuery(
        data.index,
        data.path,
        { kind: "Comparison", comparison: data.comparison },
        settings.queries
      );
      settings.queries = newQueries;
      await syncStateAndSettingsToDatabase(appState, settings);

      return sendRerender(appState, settings);
    }
    case "SetMoodValueChoice": {
      const newQueries = updateQuery(
        data.index,
        data.path,
        { kind: "MoodValue", moodValue: data.moodValue },
        settings.queries
      );
      settings.queries = newQueries;
      await syncStateAndSettingsToDatabase(appState, settings);

      return sendRerender(appState, settings);
    }
    case "SetCombineQuery": {
      const newQueries = updateQuery(
        data.index,
        data.path,
        { kind: "CombineQuery", combineQueryKind: data.combineQueryKind },
        settings.queries
      );
      settings.queries = newQueries;
      await syncStateAndSettingsToDatabase(appState, settings);

      return sendRerender(appState, settings);
    }
    case "AddNewDurationQuery": {
      settings.queries.splice(0, 0, {
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
      await syncStateAndSettingsToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "AddNewFilterQuery": {
      settings.queries.splice(0, 0, {
        kind: "Filter",
        comparison: EqualTo,
        prompt: "Today's feelings of anxiety",
        value: 1,
      });
      await syncStateAndSettingsToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
    case "DeleteQuery": {
      settings.queries.splice(data.index, 1);
      await syncStateAndSettingsToDatabase(appState, settings);
      return sendRerender(appState, settings);
    }
  }
}

export async function registerUpdateHandler(): Promise<void> {
  const maybeDatabaseRecords = await initIndexedDB();

  if (maybeDatabaseRecords !== null) {
    appState = maybeDatabaseRecords.appState;
    settings = maybeDatabaseRecords.settings;
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

  renderChannel.channel.addEventListener("message", update);
  renderChannel.channel.addEventListener("messageerror", (error) =>
    console.error("CHANNEL ERROR:", error)
  );

  hasBackend = await hasHeartbeat();
}
