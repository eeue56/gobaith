import {
  AppState,
  Day,
  generateRandomMoodValue,
  generateRandomMoodValueInRange,
  JournalEntry,
  LATEST_DATABASE_VERSION,
  LogEntry,
  PromptResponses,
} from "../types";
import { dateToDay, previousDay } from "./dates";

/**
 * Generates data for one day for use in examples
 */
function generateDataForADay(day: Day): JournalEntry {
  const pills = {};
  const logs: LogEntry[] = [];
  const promptResponses: PromptResponses = PromptResponses(
    generateRandomMoodValue(),
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
    logs: logs,
  };
}

type CurrentMoodState = "Manic" | "Hypo" | "Depressed" | "Normal";
type CurrentMoodLength = number;

/**
 * Generates data for one day for use in examples
 */
function generatePromptResponsesBasedOnMoodState(
  currentMoodState: CurrentMoodState,
  currentMoodLength: CurrentMoodLength
): {
  promptResponses: PromptResponses;
  newState: CurrentMoodState;
  newLength: CurrentMoodLength;
} {
  const promptResponses: PromptResponses = PromptResponses(
    generateRandomMoodValue(),
    generateRandomMoodValue(),
    generateRandomMoodValue(),
    generateRandomMoodValue(),
    generateRandomMoodValue(),
    generateRandomMoodValue()
  );

  switch (currentMoodState) {
    case "Manic": {
      if (currentMoodLength > 14 && Math.random() * 100 > 50) {
        return generatePromptResponsesBasedOnMoodState("Normal", 0);
      }
      promptResponses["Today's feelings of anxiety"] =
        generateRandomMoodValueInRange(1, 4);
      promptResponses["Today's feelings of depression"] =
        generateRandomMoodValueInRange(1, 2);
      promptResponses["Today's feelings of elevation"] =
        generateRandomMoodValueInRange(3, 4);
      promptResponses["Today's feelings of irritableness"] =
        generateRandomMoodValueInRange(2, 4);
      promptResponses["Today's psychotic symptoms"] =
        generateRandomMoodValueInRange(1, 4);

      break;
    }
    case "Hypo": {
      if (currentMoodLength > 7) {
        if (Math.random() * 100 > 50) {
          return generatePromptResponsesBasedOnMoodState("Normal", 0);
        }

        return generatePromptResponsesBasedOnMoodState("Manic", 8);
      }
      promptResponses["Today's feelings of anxiety"] =
        generateRandomMoodValueInRange(1, 4);
      promptResponses["Today's feelings of depression"] =
        generateRandomMoodValueInRange(1, 3);
      promptResponses["Today's feelings of elevation"] =
        generateRandomMoodValueInRange(2, 4);
      promptResponses["Today's feelings of irritableness"] =
        generateRandomMoodValueInRange(1, 4);
      promptResponses["Today's psychotic symptoms"] =
        generateRandomMoodValueInRange(1, 4);

      break;
    }
    case "Depressed": {
      if (currentMoodLength > 10) {
        if (Math.random() * 100 > 50) {
          return generatePromptResponsesBasedOnMoodState("Normal", 0);
        }
      }
      promptResponses["Today's feelings of anxiety"] =
        generateRandomMoodValueInRange(1, 4);
      promptResponses["Today's feelings of depression"] =
        generateRandomMoodValueInRange(3, 4);
      promptResponses["Today's feelings of elevation"] =
        generateRandomMoodValueInRange(1, 2);
      promptResponses["Today's feelings of irritableness"] =
        generateRandomMoodValueInRange(1, 4);
      promptResponses["Today's psychotic symptoms"] =
        generateRandomMoodValueInRange(1, 4);

      break;
    }
    case "Normal": {
      if (Math.random() * 100 < 50) {
        if (Math.random() * 100 > 50) {
          return generatePromptResponsesBasedOnMoodState("Manic", 0);
        }

        return generatePromptResponsesBasedOnMoodState("Depressed", 0);
      }
      promptResponses["Today's feelings of anxiety"] =
        generateRandomMoodValueInRange(1, 2);
      promptResponses["Today's feelings of depression"] =
        generateRandomMoodValueInRange(1, 2);
      promptResponses["Today's feelings of elevation"] =
        generateRandomMoodValueInRange(1, 2);
      promptResponses["Today's feelings of irritableness"] =
        generateRandomMoodValueInRange(1, 2);
      promptResponses["Today's psychotic symptoms"] =
        generateRandomMoodValueInRange(1, 4);

      break;
    }
  }

  return {
    promptResponses,
    newState: currentMoodState,
    newLength: currentMoodLength + 1,
  };
}

/**
 * Generate data for example usage, starting at a particular day
 */
export function generateDataBasedOnCurrentMood(startDay: Day): AppState {
  const entries: JournalEntry[] = [];
  let day = startDay;
  let currentMoodState: CurrentMoodState = "Normal";
  let currentMoodLength: CurrentMoodLength = 0;
  for (let i = 0; i < 100; i++) {
    const { promptResponses, newLength, newState } =
      generatePromptResponsesBasedOnMoodState(
        currentMoodState,
        currentMoodLength
      );

    const pills = {};
    const logs: LogEntry[] = [];

    currentMoodState = newState;
    currentMoodLength = newLength;
    entries.push({ day: day, pills, logs, promptResponses });
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
    JSON.stringify(generateDataBasedOnCurrentMood(dateToDay(new Date())))
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
