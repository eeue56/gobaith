import { markDatabaseVersion } from "./mark_database_version";

export function addDatabaseVersion(data: unknown): unknown {
  if (typeof data === "object") {
    // only add databaseVersion if it's not already there
    if ("databaseVersion" in (data as any)) {
      return data;
    }
    markDatabaseVersion(data, 4);
    return data;
  }
  return data;
}
