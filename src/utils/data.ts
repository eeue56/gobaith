import {
  AppState,
  Day,
  generateRandomMoodValue,
  JournalEntry,
  LATEST_DATABASE_VERSION,
  LogEntry,
  PromptResponses,
} from "../types";
import { previousDay } from "../updaters";
import { dateToDay } from "./dates";

/**
 * Generates data for one day for use in examples
 */
function generateDataForADay(day: Day): JournalEntry {
  const pills = {};
  const hoursSlept = Math.floor(Math.random() * 48) / 2;
  const logs: LogEntry[] = [];
  const promptResponses: PromptResponses = PromptResponses(
    generateRandomMoodValue(),
    generateRandomMoodValue(),
    generateRandomMoodValue(),
    generateRandomMoodValue(),
    generateRandomMoodValue()
  );

  return {
    day: day,
    pills: pills,
    promptResponses: promptResponses,
    hoursSlept: hoursSlept,
    logs: logs,
  };
}

/**
 * Generate data for example usage, starting at a particular day
 */
export function generateData(startDay: Day): AppState {
  const entries: JournalEntry[] = [];
  let day = startDay;
  for (let i = 0; i < 100; i++) {
    entries.push(generateDataForADay(day));
    day = previousDay(day);
  }

  return {
    kind: "AppState",
    day: startDay,
    currentGraph: "DAILY_BAR",
    currentTab: "SETTINGS",
    journalEntries: entries,
    databaseVersion: LATEST_DATABASE_VERSION,
  };
}

async function main() {
  const { writeFile } = await import("fs/promises");

  await writeFile(
    "generated_state.json",
    JSON.stringify(generateData(dateToDay(new Date())))
  );

  console.log("Wrote to generated_state.json");
}

if (process.versions.bun) {
  if (require.main === process.mainModule) {
    main();
  }
} else {
  if (require.main === module) {
    main();
  }
}
