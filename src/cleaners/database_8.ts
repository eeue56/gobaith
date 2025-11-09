import { PROMPTS } from "../types";
import { markDatabaseVersion } from "./mark_database_version";

export function updateSettingsToDatabaseVersion8(data: unknown): unknown {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  const dataObj = data as any;

  if (dataObj.kind === "Settings") {
    if (!dataObj.enabledPrompts) {
      dataObj.enabledPrompts = new Set(PROMPTS);
    }

    if (typeof dataObj.hasCompletedSetup !== "boolean") {
      dataObj.hasCompletedSetup = true;
    }

    if (!Array.isArray(dataObj.customPrompts)) {
      dataObj.customPrompts = [];
    }
  }

  markDatabaseVersion(data, 8);
  return data;
}

export function updateAppStateToDatabaseVersion8(data: unknown): unknown {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  const dataObj = data as any;

  if (dataObj.kind === "AppState" && Array.isArray(dataObj.journalEntries)) {
    for (const entry of dataObj.journalEntries) {
      if (!("customPromptResponses" in entry)) {
        entry["customPromptResponses"] = {};
      }
    }
  }

  markDatabaseVersion(data, 8);
  return data;
}
