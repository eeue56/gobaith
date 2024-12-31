import { BUILT_IN_QUERIES } from "../logic/query";
import { markDatabaseVersion } from "./mark_database_version";

export function addQueriesToSettings(data: unknown): unknown {
  if (typeof data === "object") {
    // only add queries if it's not already there
    if ("queries" in (data as any)) {
      return data;
    }
    (data as any)["queries"] = [...BUILT_IN_QUERIES];
    markDatabaseVersion(data, 5);
    return data;
  }
  return data;
}

export function addDatabaseVersionToAppState(data: unknown): unknown {
  if (typeof data === "object") {
    markDatabaseVersion(data, 5);
    return data;
  }
  return data;
}
