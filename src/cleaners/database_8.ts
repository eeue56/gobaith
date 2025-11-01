import { PROMPTS } from "../types";
import { markDatabaseVersion } from "./mark_database_version";

/**
 * Add enabledPrompts and hasCompletedSetup fields to Settings
 * Database version 8 adds configurable prompts
 * 
 * For existing users, enable all prompts by default to maintain backwards compatibility
 */
export function updateSettingsToDatabaseVersion8(data: unknown): unknown {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  const dataObj = data as any;

  if (dataObj.kind === "Settings") {
    // If enabledPrompts doesn't exist, create it with all prompts enabled
    // This ensures existing users see all prompts as before
    if (!dataObj.enabledPrompts) {
      dataObj.enabledPrompts = new Set(PROMPTS);
    }

    // If hasCompletedSetup doesn't exist, set it to true for existing users
    // This prevents them from seeing the first-time setup screen
    if (typeof dataObj.hasCompletedSetup !== "boolean") {
      dataObj.hasCompletedSetup = true;
    }

    // Initialize customPrompts if it doesn't exist
    if (!Array.isArray(dataObj.customPrompts)) {
      dataObj.customPrompts = [];
    }
  }

  markDatabaseVersion(data, 8);
  return data;
}

/**
 * Update AppState to database version 8
 * AppState doesn't need changes for prompt configuration
 */
export function updateAppStateToDatabaseVersion8(data: unknown): unknown {
  if (typeof data === "object") {
    markDatabaseVersion(data, 8);
    return data;
  }
  return data;
}
