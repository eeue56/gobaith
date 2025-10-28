import { Pill } from "../types";
import { markDatabaseVersion } from "./mark_database_version";

/**
 * Migrate Settings.currentPills from string[] to Pill[]
 * This migration converts old pill format like "Paracetamol 100mg" 
 * to new format { name: "Paracetamol", dosage: "100mg" }
 */
export function migrateCurrentPillsToPillObjects(data: unknown): unknown {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  const dataObj = data as any;

  if (dataObj.kind === "Settings" && Array.isArray(dataObj.currentPills)) {
    const newPills: Pill[] = [];
    
    for (const pill of dataObj.currentPills) {
      // If it's already a Pill object, keep it
      if (typeof pill === "object" && "name" in pill && "dosage" in pill) {
        newPills.push(pill);
      } else if (typeof pill === "string") {
        // Parse string format to extract name and dosage
        // Try to find common dosage patterns
        const match = pill.match(/^(.+?)\s+([\d.]+\s*(?:mg|g|ml|mcg|µg|iu|units?))$/i);
        
        if (match) {
          // If we found a dosage pattern, split it
          newPills.push({
            name: match[1].trim(),
            dosage: match[2].trim(),
          });
        } else {
          // No dosage found, use entire string as name
          newPills.push({
            name: pill.trim(),
            dosage: "",
          });
        }
      }
    }
    
    dataObj.currentPills = newPills;
  }

  markDatabaseVersion(data, 7);
  return data;
}
