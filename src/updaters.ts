import {
  AppState,
  Day,
  Direction,
  GraphName,
  JournalEntry,
  MoodValue,
  PillOrderDirection,
  Prompt,
  Settings,
  TabName,
} from "./types";
import { dateToDay, dayToDate, isSameDay } from "./utils/dates";

export function addJournalEntry(
  day: Day,
  text: string,
  time: Date,
  state: AppState
): AppState {
  for (const entry of state.journalEntries) {
    if (isSameDay(entry.day, day)) {
      entry.logs.push({ text, time });
      break;
    }
  }

  return { ...state, journalEntries: state.journalEntries };
}

export function updatePromptValue(
  entry: JournalEntry,
  prompt: Prompt,
  value: MoodValue,
  state: AppState
): AppState {
  for (const journalEntry of state.journalEntries) {
    if (isSameDay(journalEntry.day, entry.day)) {
      journalEntry.promptResponses[prompt] = value;
      break;
    }
  }

  return { ...state, journalEntries: state.journalEntries };
}

export function updateSleepValue(
  entry: JournalEntry,
  value: number,
  state: AppState
): AppState {
  for (const journalEntry of state.journalEntries) {
    if (isSameDay(journalEntry.day, entry.day)) {
      journalEntry.hoursSlept = value;
      break;
    }
  }

  return { ...state, journalEntries: state.journalEntries };
}

export function updatePillValue(
  entry: JournalEntry,
  pillName: string,
  direction: Direction,
  state: AppState
): AppState {
  for (const journalEntry of state.journalEntries) {
    if (isSameDay(journalEntry.day, entry.day)) {
      if (direction === "Next") {
        journalEntry.pills[pillName]++;
      } else if (direction === "Previous") {
        if (journalEntry.pills[pillName] > 0) {
          journalEntry.pills[pillName] = journalEntry.pills[pillName] - 1;
        }
      }
      break;
    }
  }

  return { ...state, journalEntries: state.journalEntries };
}

export function previousDay(today: Day): Day {
  const date = dayToDate(today);
  date.setDate(date.getDate() - 1);
  return dateToDay(date);
}

export function nextDay(today: Day): Day {
  const date = dayToDate(today);
  date.setDate(date.getDate() + 1);
  return dateToDay(date);
}

export function updateCurrentTab(tab: TabName, state: AppState): AppState {
  state.currentTab = tab;
  return state;
}

export function updateCurrentGraph(
  graph: GraphName,
  state: AppState
): AppState {
  state.currentGraph = graph;
  return state;
}

function move<a>(arr: a[], from: number, to: number): void {
  arr.splice(to, 0, arr.splice(from, 1)[0]);
}

export function updatePillOrder(
  settings: Settings,
  pillName: string,
  direction: PillOrderDirection
): Settings {
  const pillIndex = settings.currentPills.indexOf(pillName);

  switch (direction) {
    case "Up": {
      move(settings.currentPills, pillIndex, pillIndex - 1);
      break;
    }
    case "Down": {
      move(settings.currentPills, pillIndex, pillIndex + 1);
      break;
    }
    case "Top": {
      move(settings.currentPills, pillIndex, 0);
      break;
    }
  }

  return settings;
}

export type Modified = {
  entries: JournalEntry[];
  settings: Settings;
};

export function addPill(
  newName: string,
  entries: JournalEntry[],
  settings: Settings
): Modified {
  if (settings.currentPills.includes(newName)) {
    return {
      entries,
      settings,
    };
  }

  for (const entry of entries) {
    entry.pills[newName] = 0;
  }

  settings.currentPills.push(newName);

  return {
    entries,
    settings,
  };
}
