import { isPill, Pill } from "../types";
import { markDatabaseVersion } from "./mark_database_version";

function extractPillFromString(pillString: string): Pill | null {
  // Look for patterns like "100mg", "2.5g", etc. at the end
  const parts = pillString.trim().split(/\s+/);
  if (parts.length < 2) {
    return null;
  }

  const lastPart = parts[parts.length - 1];
  // Check if last part looks like a dosage (number + unit)
  if (/^[\d.].*/i.test(lastPart)) {
    const name = parts.slice(0, -1).join(" ");
    return { kind: "Pill", name, dosage: lastPart };
  }

  return null;
}

/**
 * Convert a string or object to a Pill object
 */
function convertToPill(item: unknown): Pill | null {
  if (isPill(item)) {
    return item;
  }

  if (typeof item === "string") {
    const parsed = extractPillFromString(item);
    if (parsed) {
      return parsed;
    }
    return { kind: "Pill", name: item.trim(), dosage: "" };
  }

  return null;
}

/**
 * Migrate Settings.currentPills from string[] to Pill[]
 * This migration converts old pill format like "Paracetamol 100mg"
 * to new format { kind: "Pill", name: "Paracetamol", dosage: "100mg" }
 */
export function migrateCurrentPillsToPillObjects(data: unknown): unknown {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  const dataObj = data as any;

  if (dataObj.kind === "Settings" && Array.isArray(dataObj.currentPills)) {
    const newPills: Pill[] = [];

    for (const pill of dataObj.currentPills) {
      const converted = convertToPill(pill);
      if (converted) {
        newPills.push(converted);
      }
    }

    dataObj.currentPills = newPills;
  }

  markDatabaseVersion(data, 7);
  return data;
}

/**
 * Update AppState to database version 7
 * AppState doesn't have pills, so this just marks the version
 */
export function updateAppStateToDatabaseVersion7(data: unknown): unknown {
  if (typeof data === "object") {
    markDatabaseVersion(data, 7);
    return data;
  }
  return data;
}
