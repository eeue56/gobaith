import {
  AppState,
  CustomPromptResponses,
  Day,
  DayState,
  getPromptValue,
  JournalEntry,
  pillKey,
  Prompt,
  PromptResponses,
  PROMPTS,
  Settings,
} from "../types";
import { dayToDate, isSameDay } from "../utils/dates";

export type InitializeResult =
  | { kind: "CreatedNewEntry"; entry: JournalEntry }
  | { kind: "AlreadyFound"; entry: JournalEntry };

export function initializeEntryForDay(
  day: Day,
  entries: JournalEntry[],
  settings: Settings
): InitializeResult {
  let entry = entries.filter((entry) => isSameDay(day, entry.day))[0];
  if (entry) {
    for (const pill of settings.currentPills) {
      const key = pillKey(pill);
      if (!Object.keys(entry.pills).includes(key)) {
        entry.pills[key] = 0;
      }
    }

    return { kind: "AlreadyFound", entry };
  }

  const pills: Record<string, number> = {};

  for (const pill of settings.currentPills) {
    pills[pillKey(pill)] = 0;
  }

  const customPromptResponses: CustomPromptResponses = {};

  for (const customPrompt of settings.customPrompts) {
    customPromptResponses[customPrompt] = 1;
  }

  entry = JournalEntry(
    day,
    pills,
    PromptResponses(1, 1, 1, 1, 1, 1, 1, 1),
    customPromptResponses,
    []
  );

  return { kind: "CreatedNewEntry", entry };
}

export function importDataFromJson(
  entriesAsString: string
): AppState | Settings | string {
  let importedData;
  try {
    importedData = JSON.parse(entriesAsString);
  } catch (err) {
    return (err as Error).message;
  }

  if (!("kind" in importedData)) {
    return `Didn't find .kind in imported data
I was expecting to find either .kind: "Settings" or .kind: "AppState".
`;
  }

  const kind = importedData.kind;

  if (kind === "AppState") {
    return importedData as AppState;
  } else if (kind === "Settings") {
    return importedData as Settings;
  } else {
    return `Wrong .kind property ${kind} in imported data
I was expecting to find either .kind: "Settings" or .kind: "AppState".`;
  }
}

export function getDataOnlyForToday(
  today: Day,
  entries: JournalEntry[]
): number[] {
  const entry = entries.filter((entry) => isSameDay(today, entry.day))[0];

  if (!entry) {
    return [];
  }

  const data: number[] = [];

  for (const prompt of PROMPTS) {
    data.push(entry.promptResponses[prompt]);
  }

  return data;
}

export function getDataForPrompt(
  prompt: Prompt | string,
  entries: JournalEntry[]
): DayState[] {
  const data: DayState[] = [];

  for (const entry of entries) {
    const moodValue = getPromptValue(prompt, entry);

    data.push({
      day: entry.day,
      moodValue,
    });
  }

  data.sort(function (a, b) {
    const firstDate = dayToDate(a.day);
    const secondDate = dayToDate(b.day);
    return firstDate > secondDate ? 1 : firstDate < secondDate ? -1 : 0;
  });

  return data;
}

export function daysBeforeToday(
  today: Day,
  journalEntries: JournalEntry[]
): JournalEntry[] {
  return journalEntries.filter((journalEntry: JournalEntry) => {
    return dayToDate(journalEntry.day) <= dayToDate(today);
  });
}
