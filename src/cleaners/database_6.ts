import { isMoodValue } from "../types";
import { markDatabaseVersion } from "./mark_database_version";

export function migrateHoursSleptToSleepQuality(data: unknown): unknown {
  if (typeof data === "object" && data !== null) {
    const dataObj = data as any;
    
    if (dataObj.kind === "AppState" && Array.isArray(dataObj.journalEntries)) {
      for (const entry of dataObj.journalEntries) {
        if ("hoursSlept" in entry && !("sleepQuality" in entry)) {
          const hoursSlept = entry.hoursSlept;
          delete entry.hoursSlept;
          
          if (hoursSlept < 5) {
            entry.sleepQuality = 1; // Poor quality: significantly below recommended sleep
          } else if (hoursSlept < 7) {
            entry.sleepQuality = 2; // Below average: below recommended range
          } else if (hoursSlept < 9) {
            entry.sleepQuality = 3; // Good: within recommended 7-9 hours
          } else {
            entry.sleepQuality = 4; // Excellent: at or above recommended range
          }
        }
        
        if (!("sleepQuality" in entry)) {
          entry.sleepQuality = 3; // Default to "good" if missing
        } else if (!isMoodValue(entry.sleepQuality)) {
          entry.sleepQuality = 3; // Reset to "good" if invalid value
        }
      }
    }
    
    markDatabaseVersion(data, 6);
    return data;
  }
  return data;
}
