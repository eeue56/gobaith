import { isMoodValue } from "../types";
import { markDatabaseVersion } from "./mark_database_version";

export function migrateHoursSleptToSleepQuality(data: unknown): unknown {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  const dataObj = data as any;

  if (dataObj.kind === "AppState" && Array.isArray(dataObj.journalEntries)) {
    for (const entry of dataObj.journalEntries) {
      let sleepQualityValue: number = 3;

      if ("hoursSlept" in entry) {
        const hoursSlept = entry.hoursSlept;
        delete entry.hoursSlept;

        if (hoursSlept < 5) {
          sleepQualityValue = 1;
        } else if (hoursSlept < 7) {
          sleepQualityValue = 2;
        } else if (hoursSlept < 9) {
          sleepQualityValue = 3;
        } else {
          sleepQualityValue = 4;
        }
      } else if ("sleepQuality" in entry && isMoodValue(entry.sleepQuality)) {
        sleepQualityValue = entry.sleepQuality;
        delete entry.sleepQuality;
      } else if ("sleepQuality" in entry) {
        delete entry.sleepQuality;
      }

      if (!entry.promptResponses) {
        entry.promptResponses = {};
      }
      
      entry.promptResponses["Sleep quality"] = sleepQualityValue;
    }
  }

  markDatabaseVersion(data, 6);
  return data;
}

export function updateSettingsToDatabaseVersion6(data: unknown): unknown {
  if (typeof data === "object") {
    markDatabaseVersion(data, 6);
    return data;
  }
  return data;
}
